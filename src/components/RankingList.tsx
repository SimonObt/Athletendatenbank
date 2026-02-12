'use client';

import { useState, useMemo } from 'react';
import { RankingEntry, RankingFilters, Tournament, TournamentLevel } from '@/types';
import { 
  Trophy, Medal, Award, Filter, Search, Calendar, Users, 
  Download, FileText, X, ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';
import { useResults } from '@/hooks/useResults';

interface RankingListProps {
  ranking: RankingEntry[];
  isLoading: boolean;
  filters: RankingFilters;
  onFiltersChange: (filters: RankingFilters) => void;
  availableYears: number[];
  tournaments?: Tournament[];
  tournamentLevels?: TournamentLevel[];
  onAthleteClick?: (athlete: RankingEntry['athlete']) => void;
}

const ITEMS_PER_PAGE = 50;

// Tournament level categories
const TOURNAMENT_LEVELS = [
  { id: 'LET', label: 'LET' },
  { id: 'BEM', label: 'BEM' },
  { id: 'LEM', label: 'LEM' },
  { id: 'WdEM', label: 'WdEM' },
  { id: 'International', label: 'International' },
];

export function RankingList({ 
  ranking, 
  isLoading, 
  filters, 
  onFiltersChange,
  availableYears,
  tournaments = [],
  tournamentLevels = [],
  onAthleteClick
}: RankingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { exportRankingToCSV } = useResults();

  // Filter ranking by search term
  const filteredRanking = useMemo(() => {
    return ranking.filter(entry => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const athleteName = `${entry.athlete.first_name} ${entry.athlete.last_name}`.toLowerCase();
      const club = entry.athlete.club?.toLowerCase() || '';
      return athleteName.includes(searchLower) || club.includes(searchLower);
    });
  }, [ranking, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRanking.length / ITEMS_PER_PAGE);
  const paginatedRanking = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRanking.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRanking, currentPage]);

  // Reset to page 1 when filters or search change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">{rank}.</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  // Get active filter tags
  const getActiveFilters = () => {
    const tags: { key: string; label: string; onRemove: () => void }[] = [];
    
    if (filters.year) {
      tags.push({
        key: 'year',
        label: `Jahr: ${filters.year}`,
        onRemove: () => onFiltersChange({ ...filters, year: undefined })
      });
    }
    
    if (filters.gender) {
      tags.push({
        key: 'gender',
        label: `Geschlecht: ${filters.gender}`,
        onRemove: () => onFiltersChange({ ...filters, gender: undefined })
      });
    }
    
    if (filters.birthYearMin) {
      tags.push({
        key: 'birthYearMin',
        label: `Jahrgang ab: ${filters.birthYearMin}`,
        onRemove: () => onFiltersChange({ ...filters, birthYearMin: undefined })
      });
    }
    
    if (filters.birthYearMax) {
      tags.push({
        key: 'birthYearMax',
        label: `Jahrgang bis: ${filters.birthYearMax}`,
        onRemove: () => onFiltersChange({ ...filters, birthYearMax: undefined })
      });
    }
    
    if (filters.ageGroup) {
      tags.push({
        key: 'ageGroup',
        label: `Altersklasse: ${filters.ageGroup}`,
        onRemove: () => onFiltersChange({ ...filters, ageGroup: undefined })
      });
    }
    
    if (filters.tournamentLevels?.length) {
      filters.tournamentLevels.forEach(level => {
        tags.push({
          key: `level-${level}`,
          label: `Level: ${level}`,
          onRemove: () => onFiltersChange({ 
            ...filters, 
            tournamentLevels: filters.tournamentLevels?.filter(l => l !== level) 
          })
        });
      });
    }
    
    if (filters.tournamentId) {
      const tournament = tournaments.find(t => t.id === filters.tournamentId);
      tags.push({
        key: 'tournament',
        label: `Turnier: ${tournament?.name || filters.tournamentId}`,
        onRemove: () => onFiltersChange({ ...filters, tournamentId: undefined })
      });
    }
    
    return tags;
  };

  const activeFilters = getActiveFilters();

  // CSV Export
  const handleCSVExport = () => {
    const csvContent = exportRankingToCSV(filteredRanking, filters);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `rangliste_${date}.csv`;
    link.click();
  };

  // PDF Export (using print-to-PDF)
  const handlePDFExport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date().toLocaleDateString('de-DE');
    const filterSummary = activeFilters.map(f => f.label).join(', ') || 'Keine Filter';
    
    const rows = filteredRanking.map(entry => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.rank || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.athlete.last_name}, ${entry.athlete.first_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.athlete.club || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.athlete.birth_year}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${entry.athlete.gender === 'weiblich' ? 'w' : entry.athlete.gender === 'männlich' ? 'm' : 'd'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${entry.tournament_count}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${entry.total_points}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rangliste ${date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; margin-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f3f4f6; padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
          tr:nth-child(even) { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>Rangliste</h1>
        <div class="meta">
          Exportiert am: ${date}<br>
          Filter: ${filterSummary}<br>
          Anzahl Athleten: ${filteredRanking.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>Rang</th>
              <th>Name</th>
              <th>Verein</th>
              <th>Jg.</th>
              <th>Geschl.</th>
              <th>Turniere</th>
              <th>Punkte</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Toggle tournament level selection
  const toggleTournamentLevel = (level: string) => {
    const current = filters.tournamentLevels || [];
    if (current.includes(level)) {
      onFiltersChange({ 
        ...filters, 
        tournamentLevels: current.filter(l => l !== level) 
      });
    } else {
      onFiltersChange({ 
        ...filters, 
        tournamentLevels: [...current, level] 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">Lade Rangliste...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{ranking.length}</div>
          <div className="text-sm text-gray-500">Athleten</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {ranking.reduce((sum, r) => sum + r.tournament_count, 0)}
          </div>
          <div className="text-sm text-gray-500">Turnierteilnahmen</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {ranking.reduce((sum, r) => sum + r.total_points, 0)}
          </div>
          <div className="text-sm text-gray-500">Punkte gesamt</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {ranking.length > 0 ? Math.round(ranking.reduce((sum, r) => sum + r.total_points, 0) / ranking.length) : 0}
          </div>
          <div className="text-sm text-gray-500">Ø Punkte</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filter</span>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showFilters ? 'Weniger anzeigen' : 'Mehr Filter'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Jahr
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                year: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Alle Jahre</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Geschlecht
            </label>
            <select
              value={filters.gender || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                gender: e.target.value as 'männlich' | 'weiblich' | 'divers' | undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Alle</option>
              <option value="männlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
              <option value="divers">Divers</option>
            </select>
          </div>

          {/* Birth Year Min */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jahrgang von
            </label>
            <input
              type="number"
              value={filters.birthYearMin || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                birthYearMin: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="z.B. 2008"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Birth Year Max */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jahrgang bis
            </label>
            <input
              type="number"
              value={filters.birthYearMax || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                birthYearMax: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="z.B. 2010"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Age Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altersklasse
                </label>
                <select
                  value={filters.ageGroup || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    ageGroup: e.target.value || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Alle Altersklassen</option>
                  <option value="U11">U11</option>
                  <option value="U13">U13</option>
                  <option value="U15">U15</option>
                  <option value="U17">U17</option>
                  <option value="U20">U20</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              {/* Specific Tournament Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spezifisches Turnier
                </label>
                <select
                  value={filters.tournamentId || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    tournamentId: e.target.value || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Alle Turniere</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tournament Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turnier-Level (mehrere auswählbar)
              </label>
              <div className="flex flex-wrap gap-2">
                {TOURNAMENT_LEVELS.map(level => {
                  const isSelected = filters.tournamentLevels?.includes(level.id);
                  return (
                    <button
                      key={level.id}
                      onClick={() => toggleTournamentLevel(level.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => onFiltersChange({})}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
            >
              {filter.label}
              <button
                onClick={filter.onRemove}
                className="p-0.5 hover:bg-blue-100 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Athlet oder Verein suchen..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title="Als CSV exportieren"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handlePDFExport}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            title="Als PDF exportieren"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Ranking Table */}
      {filteredRanking.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Trophy className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Ergebnisse gefunden</h3>
          <p className="text-gray-500">
            Für die gewählten Filter gibt es noch keine Einträge.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">Rang</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Athlet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Verein</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Jg.</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Turniere</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Punkte</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-16">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRanking.map((entry) => (
                <tr 
                  key={entry.athlete_id} 
                  className={`hover:bg-gray-50 ${getRankClass(entry.rank || 0)}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      {getRankIcon(entry.rank || 0)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {entry.athlete.last_name}, {entry.athlete.first_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.athlete.gender === 'weiblich' ? 'weiblich' : 'männlich'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.athlete.club || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.athlete.birth_year}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {entry.tournament_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-bold text-green-600">
                      {entry.total_points}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onAthleteClick?.(entry.athlete)}
                      className="p-1.5 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                      title="Details anzeigen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Zeige {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRanking.length)} von {filteredRanking.length} Athleten
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Seite {currentPage} von {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      {filteredRanking.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>
            Zeige {filteredRanking.length} von {ranking.length} Athleten
            {filters.year && ` für ${filters.year}`}
            {filters.gender && ` • ${filters.gender}`}
            {(filters.birthYearMin || filters.birthYearMax) && (
              ` • Jahrgang ${filters.birthYearMin || '...'}-${filters.birthYearMax || '...'}`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
