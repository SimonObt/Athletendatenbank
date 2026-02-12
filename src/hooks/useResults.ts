'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TournamentResult, 
  TournamentResultWithDetails, 
  Placement, 
  TournamentLevel,
  RankingEntry,
  RankingFilters,
  Athlete,
  ParsedResultRow,
  MatchStatus,
  AthleteStats,
  AthleteDetailedResult
} from '@/types';
import { 
  getResults, 
  getResultsByTournament as getResultsByTournamentApi,
  getResultsByAthlete as getResultsByAthleteApi,
  addResult as addResultApi,
  updateResult as updateResultApi,
  deleteResult as deleteResultApi,
  getRanking as getRankingApi,
  checkDuplicateResult
} from '@/lib/supabase';

// Valid placements in Judo (no 4th or 6th place)
export const VALID_PLACEMENTS: Placement[] = [1, 2, 3, 5, 7];

// Calculate points based on placement and tournament points
export function calculatePoints(placement: Placement, tournamentPoints: {
  points_place_1: number;
  points_place_2: number;
  points_place_3: number;
  points_place_5: number;
  points_place_7: number;
}): number {
  switch (placement) {
    case 1: return tournamentPoints.points_place_1;
    case 2: return tournamentPoints.points_place_2;
    case 3: return tournamentPoints.points_place_3;
    case 5: return tournamentPoints.points_place_5;
    case 7: return tournamentPoints.points_place_7;
    default: return 0;
  }
}

// Get placement label with Judo-specific notation
export function getPlacementLabel(placement: Placement): string {
  switch (placement) {
    case 1: return '1. Platz';
    case 2: return '2. Platz';
    case 3: return '3. Platz';
    case 5: return '5. Platz';
    case 7: return '7. Platz';
    default: return `${placement}. Platz`;
  }
}

// Validate placement (Judo has no 4th or 6th place)
export function isValidPlacement(value: number): value is Placement {
  return VALID_PLACEMENTS.includes(value as Placement);
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// Calculate similarity score (0-100%)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

// Find best matching athlete using fuzzy matching
export function findBestMatch(
  firstName: string,
  lastName: string,
  athletes: Athlete[],
  birthYear?: number,
  minSimilarity = 80
): { athlete: Athlete | null; confidence: number; similarAthletes: Athlete[] } {
  let bestMatch: Athlete | null = null;
  let bestConfidence = 0;
  const similarAthletes: Athlete[] = [];

  for (const athlete of athletes) {
    // Calculate name similarity
    const fullName1 = `${firstName} ${lastName}`.toLowerCase();
    const fullName2 = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
    const reverseName2 = `${athlete.last_name} ${athlete.first_name}`.toLowerCase();
    
    const similarity1 = calculateSimilarity(fullName1, fullName2);
    const similarity2 = calculateSimilarity(fullName1, reverseName2);
    const nameSimilarity = Math.max(similarity1, similarity2);

    // Boost confidence if birth year matches
    let confidence = nameSimilarity;
    if (birthYear && athlete.birth_year === birthYear) {
      confidence = Math.min(100, confidence + 10);
    }

    if (confidence >= minSimilarity) {
      similarAthletes.push(athlete);
    }

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = athlete;
    }
  }

  // Only return best match if it meets minimum threshold
  if (bestConfidence < minSimilarity) {
    return { athlete: null, confidence: bestConfidence, similarAthletes };
  }

  return { athlete: bestMatch, confidence: bestConfidence, similarAthletes };
}

export function useResults() {
  const [results, setResults] = useState<TournamentResultWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all results on mount
  useEffect(() => {
    const loadResults = async () => {
      const data = await getResults();
      setResults(data);
      setIsLoading(false);
    };
    loadResults();
  }, []);

  // Get results by tournament
  const getResultsByTournament = useCallback(async (tournamentId: string): Promise<TournamentResultWithDetails[]> => {
    return await getResultsByTournamentApi(tournamentId);
  }, []);

  // Get results by athlete
  const getResultsByAthlete = useCallback(async (athleteId: string): Promise<TournamentResultWithDetails[]> => {
    return await getResultsByAthleteApi(athleteId);
  }, []);

  // Add single result
  const addResult = useCallback(async (
    resultData: Omit<TournamentResult, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await addResultApi(resultData);

    if (result.success) {
      const updated = await getResults();
      setResults(updated);
    }

    return result;
  }, []);

  // Update result
  const updateResult = useCallback(async (
    id: string, 
    updates: Partial<TournamentResult>
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await updateResultApi(id, updates);

    if (result.success) {
      const updated = await getResults();
      setResults(updated);
    }

    return result;
  }, []);

  // Delete result
  const deleteResult = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteResultApi(id);

    if (result.success) {
      const updated = await getResults();
      setResults(updated);
    }

    return result;
  }, []);

  // Get ranking
  const getRanking = useCallback(async (filters: RankingFilters): Promise<RankingEntry[]> => {
    return await getRankingApi(filters);
  }, []);

  // Check for duplicate result
  const checkDuplicate = useCallback(async (
    tournamentId: string, 
    athleteId: string
  ): Promise<TournamentResult | null> => {
    return await checkDuplicateResult(tournamentId, athleteId);
  }, []);

  // Parse and match CSV rows
  const parseResultRows = useCallback((
    csvData: Record<string, string>[],
    athletes: Athlete[]
  ): ParsedResultRow[] => {
    const parsedRows: ParsedResultRow[] = [];

    csvData.forEach((row, index) => {
      // Parse placement
      const placementValue = parseInt(row.Platz || row.Platzierung || '0');
      if (!isValidPlacement(placementValue)) {
        return; // Skip invalid placements
      }

      // Parse name (support both combined and separate fields)
      let firstName = '';
      let lastName = '';
      
      if (row.Vorname && row.Nachname) {
        firstName = row.Vorname.trim();
        lastName = row.Nachname.trim();
      } else if (row.Name) {
        const parts = row.Name.trim().split(/\s+/);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          lastName = parts[0] || '';
        }
      }

      if (!firstName && !lastName) {
        return; // Skip rows without names
      }

      // Parse birth year
      const birthYear = row.Jahrgang ? parseInt(row.Jahrgang) : undefined;

      // Find matching athlete
      const { athlete, confidence, similarAthletes } = findBestMatch(
        firstName,
        lastName,
        athletes,
        birthYear
      );

      let matchStatus: MatchStatus = 'unknown';
      if (athlete && confidence >= 95) {
        matchStatus = 'exact';
      } else if (athlete && confidence >= 80) {
        matchStatus = 'similar';
      }

      parsedRows.push({
        rowIndex: index,
        firstName,
        lastName,
        birthYear,
        club: row.Verein?.trim(),
        gender: row.Geschlecht?.trim(),
        placement: placementValue,
        matchedAthlete: athlete || undefined,
        matchStatus,
        matchConfidence: confidence,
        similarAthletes: similarAthletes.slice(0, 3), // Top 3 similar
      });
    });

    return parsedRows;
  }, []);

  // Import multiple results
  const importResults = useCallback(async (
    tournamentId: string,
    parsedRows: ParsedResultRow[],
    actions: Map<number, 'import' | 'skip' | 'create'>,
    tournamentPoints: {
      points_place_1: number;
      points_place_2: number;
      points_place_3: number;
      points_place_5: number;
      points_place_7: number;
    }
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
    duplicates: Array<{ row: ParsedResultRow; existing: TournamentResult }>;
  }> => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const duplicates: Array<{ row: ParsedResultRow; existing: TournamentResult }> = [];

    for (const row of parsedRows) {
      const action = actions.get(row.rowIndex) || 'skip';

      if (action === 'skip') {
        skipped++;
        continue;
      }

      try {
        if (!row.matchedAthlete) {
          errors.push(`Zeile ${row.rowIndex + 1}: Kein Athlet zugeordnet`);
          continue;
        }

        // Check for existing result (duplicate)
        const existing = await checkDuplicateResult(tournamentId, row.matchedAthlete.id);
        if (existing) {
          duplicates.push({ row, existing });
          continue;
        }

        // Calculate points
        const points = calculatePoints(row.placement, tournamentPoints);

        // Create result
        await addResultApi({
          tournament_id: tournamentId,
          athlete_id: row.matchedAthlete.id,
          placement: row.placement,
          points,
          is_manual: false,
          imported_at: new Date().toISOString(),
        });

        imported++;
      } catch (error) {
        errors.push(`Zeile ${row.rowIndex + 1}: ${error}`);
      }
    }

    // Refresh results list
    const refreshed = await getResults();
    setResults(refreshed);

    return { imported, skipped, errors, duplicates };
  }, []);

  // Export ranking to CSV
  const exportRankingToCSV = useCallback((ranking: RankingEntry[], filters: RankingFilters): string => {
    const headers = ['Rang', 'Name', 'Verein', 'Jahrgang', 'Geschlecht', 'Punkte', 'Turniere'];
    const rows = ranking.map(entry => [
      entry.rank?.toString() || '',
      `${entry.athlete.last_name}, ${entry.athlete.first_name}`,
      entry.athlete.club || '-',
      entry.athlete.birth_year.toString(),
      entry.athlete.gender === 'weiblich' ? 'w' : entry.athlete.gender === 'männlich' ? 'm' : 'd',
      entry.total_points.toString(),
      entry.tournament_count.toString(),
    ]);
    
    // Add filter summary as header
    const filterSummary: string[] = [];
    if (filters.year) filterSummary.push(`Jahr: ${filters.year}`);
    if (filters.gender) filterSummary.push(`Geschlecht: ${filters.gender}`);
    if (filters.birthYearMin || filters.birthYearMax) {
      filterSummary.push(`Jahrgang: ${filters.birthYearMin || '...'}-${filters.birthYearMax || '...'}`);
    }
    if (filters.ageGroup) filterSummary.push(`Altersklasse: ${filters.ageGroup}`);
    if (filters.tournamentLevels?.length) filterSummary.push(`Level: ${filters.tournamentLevels.join(', ')}`);
    if (filters.tournamentId) filterSummary.push(`Turnier: ${filters.tournamentId}`);
    
    const csvContent = [
      '# Rangliste exportiert am ' + new Date().toLocaleDateString('de-DE'),
      filterSummary.length > 0 ? '# Filter: ' + filterSummary.join(' | ') : '# Keine Filter aktiviert',
      '',
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    return csvContent;
  }, []);

  // Get detailed athlete results for detail view
  const getAthleteResultsDetailed = useCallback(async (athleteId: string): Promise<AthleteStats | null> => {
    const results = await getResultsByAthleteApi(athleteId);
    
    if (results.length === 0) {
      return null;
    }
    
    // Sort by tournament date
    const sortedResults = results
      .filter(r => r.tournament)
      .sort((a, b) => new Date(a.tournament!.date).getTime() - new Date(b.tournament!.date).getTime());
    
    const detailedResults: AthleteDetailedResult[] = sortedResults.map(r => ({
      result: r,
      tournament: r.tournament!,
      date: r.tournament!.date,
    }));
    
    // Group by year
    const resultsByYear: Record<number, AthleteDetailedResult[]> = {};
    detailedResults.forEach(dr => {
      const year = new Date(dr.date).getFullYear();
      if (!resultsByYear[year]) resultsByYear[year] = [];
      resultsByYear[year].push(dr);
    });
    
    // Calculate points progression
    let cumulativePoints = 0;
    const pointsProgression = detailedResults.map(dr => {
      cumulativePoints += dr.result.points;
      return {
        date: dr.date,
        cumulativePoints,
        tournamentName: dr.tournament.name,
      };
    });
    
    // Calculate stats
    const placements = sortedResults.map(r => r.placement);
    const averagePlacement = placements.length > 0 
      ? placements.reduce((sum, p) => sum + p, 0) / placements.length 
      : 0;
    const bestPlacement = placements.length > 0 
      ? Math.min(...placements) as Placement 
      : null;
    
    return {
      totalTournaments: sortedResults.length,
      totalPoints: sortedResults.reduce((sum, r) => sum + r.points, 0),
      averagePlacement: Math.round(averagePlacement * 10) / 10,
      bestPlacement,
      resultsByYear,
      pointsProgression,
    };
  }, []);

  return {
    results,
    isLoading,
    getResultsByTournament,
    getResultsByAthlete,
    addResult,
    updateResult,
    deleteResult,
    getRanking,
    checkDuplicate,
    parseResultRows,
    importResults,
    exportRankingToCSV,
    getAthleteResultsDetailed,
  };
}