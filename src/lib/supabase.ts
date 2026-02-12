import { createClient } from '@supabase/supabase-js'
import { Athlete, Tournament, TournamentLevel, TournamentResult, TournamentResultWithDetails, RankingEntry, RankingFilters, Placement, TrainingCamp, TrainingCampWithDetails, CampParticipant, CampParticipantWithDetails, CampFilters } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Fallback to localStorage if Supabase is not configured
const isSupabaseConfigured = supabaseUrl && supabaseKey

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// LocalStorage fallback
const STORAGE_KEY = 'athletendatenbank_athletes'
const TOURNAMENTS_STORAGE_KEY = 'athletendatenbank_tournaments'
const TOURNAMENT_LEVELS_STORAGE_KEY = 'athletendatenbank_tournament_levels'
const RESULTS_STORAGE_KEY = 'athletendatenbank_results'
const CAMPS_STORAGE_KEY = 'athletendatenbank_camps'
const CAMP_PARTICIPANTS_STORAGE_KEY = 'athletendatenbank_camp_participants'

const getLocalAthletes = (): Athlete[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const setLocalAthletes = (athletes: Athlete[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes))
}

const getLocalTournaments = (): Tournament[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TOURNAMENTS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const setLocalTournaments = (tournaments: Tournament[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(tournaments))
}

const getLocalTournamentLevels = (): TournamentLevel[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TOURNAMENT_LEVELS_STORAGE_KEY)
  if (stored) return JSON.parse(stored)
  // Return default levels if none stored
  return getDefaultTournamentLevels()
}

const setLocalTournamentLevels = (levels: TournamentLevel[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOURNAMENT_LEVELS_STORAGE_KEY, JSON.stringify(levels))
}

const getLocalResults = (): TournamentResult[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(RESULTS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const setLocalResults = (results: TournamentResult[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results))
}

// Training Camps localStorage helpers
const getLocalCamps = (): TrainingCamp[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(CAMPS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const setLocalCamps = (camps: TrainingCamp[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(CAMPS_STORAGE_KEY, JSON.stringify(camps))
}

const getLocalCampParticipants = (): CampParticipant[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(CAMP_PARTICIPANTS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const setLocalCampParticipants = (participants: CampParticipant[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(CAMP_PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants))
}

const getDefaultTournamentLevels = (): TournamentLevel[] => {
  const now = new Date().toISOString()
  return [
    { id: '1', name: 'LET U14', points_place_1: 8, points_place_2: 6, points_place_3: 4, points_place_5: 2, points_place_7: 1, created_at: now, updated_at: now },
    { id: '2', name: 'BEM U11', points_place_1: 6, points_place_2: 4, points_place_3: 2, points_place_5: 1, points_place_7: 0, created_at: now, updated_at: now },
    { id: '3', name: 'BEM U13', points_place_1: 6, points_place_2: 4, points_place_3: 2, points_place_5: 1, points_place_7: 0, created_at: now, updated_at: now },
    { id: '4', name: 'LEM U13', points_place_1: 10, points_place_2: 7, points_place_3: 5, points_place_5: 3, points_place_7: 1, created_at: now, updated_at: now },
    { id: '5', name: 'BEM U15', points_place_1: 8, points_place_2: 6, points_place_3: 4, points_place_5: 2, points_place_7: 1, created_at: now, updated_at: now },
    { id: '6', name: 'WdEM U15', points_place_1: 10, points_place_2: 7, points_place_3: 5, points_place_5: 3, points_place_7: 1, created_at: now, updated_at: now },
    { id: '7', name: 'LET U15', points_place_1: 8, points_place_2: 6, points_place_3: 4, points_place_5: 2, points_place_7: 1, created_at: now, updated_at: now },
    { id: '8', name: 'Backnang U15', points_place_1: 10, points_place_2: 7, points_place_3: 5, points_place_5: 3, points_place_7: 1, created_at: now, updated_at: now },
    { id: '9', name: 'International', points_place_1: 9, points_place_2: 7, points_place_3: 5, points_place_5: 2, points_place_7: 1, created_at: now, updated_at: now },
  ]
}

// API Functions
export async function getAthletes(): Promise<Athlete[]> {
  if (!supabase) {
    return getLocalAthletes()
  }

  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error fetching athletes:', error)
    return []
  }

  return data || []
}

export async function addAthlete(athlete: Omit<Athlete, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const athletes = getLocalAthletes()
    const existing = athletes.find(a => a.import_id === athlete.import_id)
    if (existing) {
      return { success: false, error: 'Athlet existiert bereits' }
    }
    
    const newAthlete: Athlete = {
      ...athlete,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLocalAthletes([...athletes, newAthlete])
    return { success: true }
  }

  const { error } = await supabase
    .from('athletes')
    .insert([athlete])

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Athlet existiert bereits' }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateAthlete(id: string, updates: Partial<Athlete>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const athletes = getLocalAthletes()
    const updated = athletes.map(a => 
      a.id === id 
        ? { ...a, ...updates, updated_at: new Date().toISOString() }
        : a
    )
    setLocalAthletes(updated)
    return { success: true }
  }

  const { error } = await supabase
    .from('athletes')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteAthlete(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const athletes = getLocalAthletes()
    setLocalAthletes(athletes.filter(a => a.id !== id))
    return { success: true }
  }

  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getAthleteByImportId(importId: string): Promise<Athlete | null> {
  if (!supabase) {
    const athletes = getLocalAthletes()
    return athletes.find(a => a.import_id === importId) || null
  }

  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('import_id', importId)
    .single()

  if (error) {
    return null
  }

  return data
}

// Tournament Level API Functions
export async function getTournamentLevels(): Promise<TournamentLevel[]> {
  if (!supabase) {
    return getLocalTournamentLevels()
  }

  const { data, error } = await supabase
    .from('tournament_levels')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tournament levels:', error)
    return []
  }

  return data || []
}

export async function addTournamentLevel(level: Omit<TournamentLevel, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: TournamentLevel; error?: string }> {
  if (!supabase) {
    const levels = getLocalTournamentLevels()
    const newLevel: TournamentLevel = {
      ...level,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLocalTournamentLevels([...levels, newLevel])
    return { success: true, data: newLevel }
  }

  const { data, error } = await supabase
    .from('tournament_levels')
    .insert([level])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateTournamentLevel(id: string, updates: Partial<TournamentLevel>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const levels = getLocalTournamentLevels()
    const updated = levels.map(l => 
      l.id === id 
        ? { ...l, ...updates, updated_at: new Date().toISOString() }
        : l
    )
    setLocalTournamentLevels(updated)
    return { success: true }
  }

  const { error } = await supabase
    .from('tournament_levels')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteTournamentLevel(id: string): Promise<{ success: boolean; error?: string; tournamentsCount?: number }> {
  // Check if level is used by any tournaments
  const tournaments = await getTournaments()
  const usedCount = tournaments.filter(t => t.level_id === id).length
  
  if (usedCount > 0) {
    return { success: false, error: `Dieses Level wird von ${usedCount} Turnieren verwendet`, tournamentsCount: usedCount }
  }

  if (!supabase) {
    const levels = getLocalTournamentLevels()
    setLocalTournamentLevels(levels.filter(l => l.id !== id))
    return { success: true }
  }

  const { error } = await supabase
    .from('tournament_levels')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Tournament API Functions
export async function getTournaments(): Promise<Tournament[]> {
  if (!supabase) {
    return getLocalTournaments()
  }

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching tournaments:', error)
    return []
  }

  return data || []
}

export async function addTournament(tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Tournament; error?: string }> {
  if (!supabase) {
    const tournaments = getLocalTournaments()
    const newTournament: Tournament = {
      ...tournament,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLocalTournaments([...tournaments, newTournament])
    return { success: true, data: newTournament }
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert([tournament])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateTournament(id: string, updates: Partial<Tournament>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const tournaments = getLocalTournaments()
    const updated = tournaments.map(t => 
      t.id === id 
        ? { ...t, ...updates, updated_at: new Date().toISOString() }
        : t
    )
    setLocalTournaments(updated)
    return { success: true }
  }

  const { error } = await supabase
    .from('tournaments')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteTournament(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const tournaments = getLocalTournaments()
    setLocalTournaments(tournaments.filter(t => t.id !== id))
    return { success: true }
  }

  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function completeTournament(id: string): Promise<{ success: boolean; error?: string }> {
  return updateTournament(id, { status: 'completed' })
}

// Tournament Result API Functions
export async function getResults(): Promise<TournamentResultWithDetails[]> {
  if (!supabase) {
    const results = getLocalResults()
    const athletes = getLocalAthletes()
    const tournaments = getLocalTournaments()
    
    return results.map(result => ({
      ...result,
      athlete: athletes.find(a => a.id === result.athlete_id),
      tournament: tournaments.find(t => t.id === result.tournament_id),
    }))
  }

  const { data, error } = await supabase
    .from('tournament_results')
    .select(`
      *,
      athlete:athletes(*),
      tournament:tournaments(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching results:', error)
    return []
  }

  return data || []
}

export async function getResultsByTournament(tournamentId: string): Promise<TournamentResultWithDetails[]> {
  if (!supabase) {
    const results = getLocalResults().filter(r => r.tournament_id === tournamentId)
    const athletes = getLocalAthletes()
    const tournaments = getLocalTournaments()
    
    return results.map(result => ({
      ...result,
      athlete: athletes.find(a => a.id === result.athlete_id),
      tournament: tournaments.find(t => t.id === result.tournament_id),
    }))
  }

  const { data, error } = await supabase
    .from('tournament_results')
    .select(`
      *,
      athlete:athletes(*),
      tournament:tournaments(*)
    `)
    .eq('tournament_id', tournamentId)
    .order('placement', { ascending: true })

  if (error) {
    console.error('Error fetching results by tournament:', error)
    return []
  }

  return data || []
}

export async function getResultsByAthlete(athleteId: string): Promise<TournamentResultWithDetails[]> {
  if (!supabase) {
    const results = getLocalResults().filter(r => r.athlete_id === athleteId)
    const athletes = getLocalAthletes()
    const tournaments = getLocalTournaments()
    
    return results.map(result => ({
      ...result,
      athlete: athletes.find(a => a.id === result.athlete_id),
      tournament: tournaments.find(t => t.id === result.tournament_id),
    }))
  }

  const { data, error } = await supabase
    .from('tournament_results')
    .select(`
      *,
      athlete:athletes(*),
      tournament:tournaments(*)
    `)
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching results by athlete:', error)
    return []
  }

  return data || []
}

export async function addResult(result: Omit<TournamentResult, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: TournamentResult; error?: string }> {
  if (!supabase) {
    const results = getLocalResults()
    const newResult: TournamentResult = {
      ...result,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLocalResults([...results, newResult])
    return { success: true, data: newResult }
  }

  const { data, error } = await supabase
    .from('tournament_results')
    .insert([result])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateResult(id: string, updates: Partial<TournamentResult>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const results = getLocalResults()
    const updated = results.map(r => 
      r.id === id 
        ? { ...r, ...updates, updated_at: new Date().toISOString() }
        : r
    )
    setLocalResults(updated)
    return { success: true }
  }

  const { error } = await supabase
    .from('tournament_results')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteResult(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const results = getLocalResults()
    setLocalResults(results.filter(r => r.id !== id))
    return { success: true }
  }

  const { error } = await supabase
    .from('tournament_results')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function checkDuplicateResult(tournamentId: string, athleteId: string): Promise<TournamentResult | null> {
  if (!supabase) {
    const results = getLocalResults()
    return results.find(r => r.tournament_id === tournamentId && r.athlete_id === athleteId) || null
  }

  const { data, error } = await supabase
    .from('tournament_results')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('athlete_id', athleteId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function getRanking(filters: RankingFilters): Promise<RankingEntry[]> {
  if (!supabase) {
    const allResults = getLocalResults()
    const athletes = getLocalAthletes()
    const tournaments = getLocalTournaments()
    
    // Filter results by year if specified
    let filteredResults = allResults
    if (filters.year) {
      filteredResults = filteredResults.filter(r => {
        const tournament = tournaments.find(t => t.id === r.tournament_id)
        if (!tournament) return false
        const tournamentYear = new Date(tournament.date).getFullYear()
        return tournamentYear === filters.year
      })
    }
    
    // BUG-1 Fix: Filter by tournamentId if specified
    if (filters.tournamentId) {
      filteredResults = filteredResults.filter(r => r.tournament_id === filters.tournamentId)
    }
    
    // BUG-5 Fix: Filter by tournament levels if specified
    if (filters.tournamentLevels?.length) {
      filteredResults = filteredResults.filter(r => {
        const tournament = tournaments.find(t => t.id === r.tournament_id)
        return tournament && filters.tournamentLevels?.includes(tournament.level_id)
      })
    }

    // Group results by athlete
    const resultsByAthlete = new Map<string, TournamentResultWithDetails[]>()
    filteredResults.forEach(result => {
      const athlete = athletes.find(a => a.id === result.athlete_id)
      if (!athlete) return
      
      // Apply gender filter
      if (filters.gender && athlete.gender !== filters.gender) return
      
      // Apply birth year filters
      if (filters.birthYearMin && athlete.birth_year < filters.birthYearMin) return
      if (filters.birthYearMax && athlete.birth_year > filters.birthYearMax) return
      
      // Apply age group filter
      if (filters.ageGroup) {
        const tournament = tournaments.find(t => t.id === result.tournament_id)
        if (tournament?.age_group !== filters.ageGroup) return
      }
      
      const existing = resultsByAthlete.get(result.athlete_id) || []
      resultsByAthlete.set(result.athlete_id, [...existing, {
        ...result,
        athlete,
        tournament: tournaments.find(t => t.id === result.tournament_id),
      }])
    })
    
    // Calculate ranking entries
    const ranking: RankingEntry[] = []
    resultsByAthlete.forEach((results, athleteId) => {
      const athlete = athletes.find(a => a.id === athleteId)
      if (!athlete) return
      
      const totalPoints = results.reduce((sum, r) => sum + r.points, 0)
      
      ranking.push({
        athlete_id: athleteId,
        athlete,
        total_points: totalPoints,
        tournament_count: results.length,
        results,
      })
    })
    
    // Sort by total points (descending)
    ranking.sort((a, b) => b.total_points - a.total_points)
    
    // BUG-3 Fix: Assign shared ranks (1, 2, 2, 4 instead of 1, 2, 3, 4)
    let currentRank = 1
    let previousPoints: number | null = null
    let athletesWithSamePoints = 0
    
    ranking.forEach((entry, index) => {
      if (previousPoints === null) {
        // First entry
        entry.rank = currentRank
        previousPoints = entry.total_points
        athletesWithSamePoints = 1
      } else if (entry.total_points === previousPoints) {
        // Same points as previous - share rank
        entry.rank = currentRank
        athletesWithSamePoints++
      } else {
        // Different points - new rank (skipping positions as needed)
        currentRank += athletesWithSamePoints
        entry.rank = currentRank
        previousPoints = entry.total_points
        athletesWithSamePoints = 1
      }
    })
    
    return ranking
  }

  // For Supabase, we use a database function or complex query
  // For now, we'll fetch all and filter client-side
  const { data: allResults, error } = await supabase
    .from('tournament_results')
    .select(`
      *,
      athlete:athletes(*),
      tournament:tournaments(*)
    `)

  if (error) {
    console.error('Error fetching ranking:', error)
    return []
  }

  // Filter results by year if specified
  let filteredResults = allResults || []
  if (filters.year) {
    filteredResults = filteredResults.filter(r => {
      const tournamentYear = new Date(r.tournament.date).getFullYear()
      return tournamentYear === filters.year
    })
  }
  
  // BUG-1 Fix: Filter by tournamentId if specified
  if (filters.tournamentId) {
    filteredResults = filteredResults.filter(r => r.tournament_id === filters.tournamentId)
  }
  
  // BUG-5 Fix: Filter by tournament levels if specified
  if (filters.tournamentLevels?.length) {
    filteredResults = filteredResults.filter(r => {
      return r.tournament && filters.tournamentLevels?.includes(r.tournament.level_id)
    })
  }
  
  // Group results by athlete
  const resultsByAthlete = new Map<string, TournamentResultWithDetails[]>()
  filteredResults.forEach((result: TournamentResultWithDetails) => {
    if (!result.athlete) return
    
    // Apply gender filter
    if (filters.gender && result.athlete.gender !== filters.gender) return
    
    // Apply birth year filters
    if (filters.birthYearMin && result.athlete.birth_year < filters.birthYearMin) return
    if (filters.birthYearMax && result.athlete.birth_year > filters.birthYearMax) return
    
    // Apply age group filter
    if (filters.ageGroup && result.tournament?.age_group !== filters.ageGroup) return
    
    const existing = resultsByAthlete.get(result.athlete_id) || []
    resultsByAthlete.set(result.athlete_id, [...existing, result])
  })
  
  // Calculate ranking entries
  const ranking: RankingEntry[] = []
  resultsByAthlete.forEach((results, athleteId) => {
    const athlete = results[0]?.athlete
    if (!athlete) return
    
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0)
    
    ranking.push({
      athlete_id: athleteId,
      athlete,
      total_points: totalPoints,
      tournament_count: results.length,
      results,
    })
  })
  
  // Sort by total points (descending)
  ranking.sort((a, b) => b.total_points - a.total_points)
  
  // BUG-3 Fix: Assign shared ranks (1, 2, 2, 4 instead of 1, 2, 3, 4)
  let currentRank = 1
  let previousPoints: number | null = null
  let athletesWithSamePoints = 0
  
  ranking.forEach((entry) => {
    if (previousPoints === null) {
      // First entry
      entry.rank = currentRank
      previousPoints = entry.total_points
      athletesWithSamePoints = 1
    } else if (entry.total_points === previousPoints) {
      // Same points as previous - share rank
      entry.rank = currentRank
      athletesWithSamePoints++
    } else {
      // Different points - new rank (skipping positions as needed)
      currentRank += athletesWithSamePoints
      entry.rank = currentRank
      previousPoints = entry.total_points
      athletesWithSamePoints = 1
    }
  })
  
  return ranking
}

// Training Camp API Functions
export async function getTrainingCamps(filters?: CampFilters): Promise<TrainingCamp[]> {
  if (!supabase) {
    let camps = getLocalCamps()
    
    // Apply filters
    if (filters) {
      if (filters.status) {
        camps = camps.filter(c => c.status === filters.status)
      }
      if (filters.dateFrom) {
        camps = camps.filter(c => c.start_date >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        camps = camps.filter(c => c.end_date <= filters.dateTo!)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        camps = camps.filter(c => 
          c.name.toLowerCase().includes(searchLower) || 
          (c.location && c.location.toLowerCase().includes(searchLower))
        )
      }
    }
    
    // Sort by start date (newest first)
    return camps.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  }

  let query = supabase
    .from('training_camps')
    .select('*')
    .order('start_date', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.dateFrom) {
    query = query.gte('start_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('end_date', filters.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching training camps:', error)
    return []
  }

  return data || []
}

export async function getTrainingCampById(id: string): Promise<TrainingCampWithDetails | null> {
  if (!supabase) {
    const camps = getLocalCamps()
    const camp = camps.find(c => c.id === id)
    if (!camp) return null
    
    const participants = await getCampParticipants(id)
    const confirmedCount = participants.filter(p => p.status === 'zugesagt').length
    
    return {
      ...camp,
      participants,
      participant_count: participants.length,
      confirmed_count: confirmedCount,
    }
  }

  const { data, error } = await supabase
    .from('training_camps')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  const participants = await getCampParticipants(id)
  const confirmedCount = participants.filter(p => p.status === 'zugesagt').length

  return {
    ...data,
    participants,
    participant_count: participants.length,
    confirmed_count: confirmedCount,
  }
}

export async function addTrainingCamp(camp: Omit<TrainingCamp, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: TrainingCamp; error?: string }> {
  if (!supabase) {
    const camps = getLocalCamps()
    const newCamp: TrainingCamp = {
      ...camp,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setLocalCamps([...camps, newCamp])
    return { success: true, data: newCamp }
  }

  const { data, error } = await supabase
    .from('training_camps')
    .insert([camp])
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateTrainingCamp(id: string, updates: Partial<TrainingCamp>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const camps = getLocalCamps()
    const updated = camps.map(c => 
      c.id === id 
        ? { ...c, ...updates, updated_at: new Date().toISOString() }
        : c
    )
    setLocalCamps(updated)
    return { success: true }
  }

  const { error } = await supabase
    .from('training_camps')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteTrainingCamp(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    // Delete participants first
    const participants = getLocalCampParticipants()
    setLocalCampParticipants(participants.filter(p => p.camp_id !== id))
    
    // Delete camp
    const camps = getLocalCamps()
    setLocalCamps(camps.filter(c => c.id !== id))
    return { success: true }
  }

  // Delete participants first (cascade)
  await supabase
    .from('camp_participants')
    .delete()
    .eq('camp_id', id)

  const { error } = await supabase
    .from('training_camps')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function duplicateTrainingCamp(id: string, newDates?: { start_date: string; end_date: string }): Promise<{ success: boolean; data?: TrainingCamp; error?: string }> {
  const original = await getTrainingCampById(id)
  if (!original) {
    return { success: false, error: 'Camp nicht gefunden' }
  }

  const { id: _, created_at, updated_at, participants, participant_count, confirmed_count, ...campData } = original

  const duplicatedCamp: Omit<TrainingCamp, 'id' | 'created_at' | 'updated_at'> = {
    ...campData,
    name: `${campData.name} (Kopie)`,
    status: 'geplant',
    start_date: newDates?.start_date || campData.start_date,
    end_date: newDates?.end_date || campData.end_date,
  }

  const result = await addTrainingCamp(duplicatedCamp)
  
  if (result.success && result.data && participants) {
    // Copy participants as "vorgeschlagen"
    for (const participant of participants) {
      await addCampParticipant({
        camp_id: result.data.id,
        athlete_id: participant.athlete_id,
        status: 'vorgeschlagen',
        comment: participant.comment,
      })
    }
  }

  return result
}

// Camp Participant API Functions
export async function getCampParticipants(campId: string): Promise<CampParticipantWithDetails[]> {
  if (!supabase) {
    const participants = getLocalCampParticipants()
    const athletes = getLocalAthletes()
    
    return participants
      .filter(p => p.camp_id === campId)
      .map(p => ({
        ...p,
        athlete: athletes.find(a => a.id === p.athlete_id),
      }))
  }

  const { data, error } = await supabase
    .from('camp_participants')
    .select(`
      *,
      athlete:athletes(*)
    `)
    .eq('camp_id', campId)
    .order('added_at', { ascending: true })

  if (error) {
    console.error('Error fetching camp participants:', error)
    return []
  }

  return data || []
}

export async function addCampParticipant(participant: Omit<CampParticipant, 'id' | 'created_at' | 'updated_at' | 'added_at' | 'status_changed_at'>): Promise<{ success: boolean; data?: CampParticipant; error?: string }> {
  if (!supabase) {
    const participants = getLocalCampParticipants()
    
    // Check for duplicate
    const existing = participants.find(p => p.camp_id === participant.camp_id && p.athlete_id === participant.athlete_id)
    if (existing) {
      return { success: false, error: 'Athlet ist bereits im Camp' }
    }
    
    const now = new Date().toISOString()
    const newParticipant: CampParticipant = {
      ...participant,
      id: crypto.randomUUID(),
      added_at: now,
      status_changed_at: now,
      created_at: now,
      updated_at: now,
    }
    setLocalCampParticipants([...participants, newParticipant])
    return { success: true, data: newParticipant }
  }

  const { data, error } = await supabase
    .from('camp_participants')
    .insert([participant])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Athlet ist bereits im Camp' }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateCampParticipant(id: string, updates: Partial<CampParticipant>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const participants = getLocalCampParticipants()
    const updated = participants.map(p => 
      p.id === id 
        ? { ...p, ...updates, status_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : p
    )
    setLocalCampParticipants(updated)
    return { success: true }
  }

  const updateData = updates.status 
    ? { ...updates, status_changed_at: new Date().toISOString() }
    : updates

  const { error } = await supabase
    .from('camp_participants')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function removeCampParticipant(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const participants = getLocalCampParticipants()
    setLocalCampParticipants(participants.filter(p => p.id !== id))
    return { success: true }
  }

  const { error } = await supabase
    .from('camp_participants')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function checkCampParticipant(campId: string, athleteId: string): Promise<CampParticipant | null> {
  if (!supabase) {
    const participants = getLocalCampParticipants()
    return participants.find(p => p.camp_id === campId && p.athlete_id === athleteId) || null
  }

  const { data, error } = await supabase
    .from('camp_participants')
    .select('*')
    .eq('camp_id', campId)
    .eq('athlete_id', athleteId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
