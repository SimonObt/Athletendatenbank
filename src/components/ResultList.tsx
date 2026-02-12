'use client';

import { useState, useEffect } from 'react';
import { TournamentResultWithDetails, Tournament, Placement } from '@/types';
import { getPlacementLabel, calculatePoints } from '@/hooks/useResults';
import { Pencil, Trash2, Plus, Upload, Trophy, Medal, Award } from 'lucide-react';

interface ResultListProps {
  tournament: Tournament;
  results: TournamentResultWithDetails[];
  onAddResult: () => void;
  onEditResult: (result: TournamentResultWithDetails) => void;
  onDeleteResult: (result: TournamentResultWithDetails) => void;
  onImportCsv: () => void;
  isLoading?: boolean;
}

export function ResultList({ 
  tournament, 
  results, 
  onAddResult, 
  onEditResult, 
  onDeleteResult,
  onImportCsv,
  isLoading 
}: ResultListProps) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'placement' | 'name'>('placement');

  // Filter and sort results
  const filteredResults = results.filter(result => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    const athleteName = result.athlete 
      ? `${result.athlete.first_name} ${result.athlete.last_name}`.toLowerCase()
      : '';
    const club = result.athlete?.club?.toLowerCase() || '';
    return athleteName.includes(searchLower) || club.includes(searchLower);
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'placement') {
      return a.placement - b.placement;
    }
    // Sort by name
    const nameA = a.athlete ? `${a.athlete.last_name} ${a.athlete.first_name}` : '';
    const nameB = b.athlete ? `${b.athlete.last_name} ${b.athlete.first_name}` : '';
    return nameA.localeCompare(nameB);
  });

  const getPlacementIcon = (placement: Placement) => {
    switch (placement) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center font-medium text-slate-600">{placement}</span>;
    }
  };

  const getPlacementClass = (placement: Placement) => {
    switch (placement) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-slate-50 border-slate-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return '';
    }
  };

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);

  if (isLoading) {
    return (
      <div className="card-modern p-8 text-center">
        <div className="text-slate-500">Lade Ergebnisse...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tournament Info */}
      <div className="bg-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">{tournament.name}</h3>
            <p className="text-sm text-indigo-700">
              {new Date(tournament.date).toLocaleDateString('de-DE')}
              {tournament.location && ` • ${tournament.location}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-700">Punktesystem</div>
            <div className="text-xs text-indigo-600">
              1.={tournament.points_place_1} • 2.={tournament.points_place_2} • 3.={tournament.points_place_3} • 5.={tournament.points_place_5} • 7.={tournament.points_place_7}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-modern p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{results.length}</div>
          <div className="text-sm text-slate-500">Teilnehmer</div>
        </div>
        <div className="card-modern p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
          <div className="text-sm text-slate-500">Punkte vergeben</div>
        </div>
        <div className="card-modern p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {results.filter(r => r.is_manual).length}
          </div>
          <div className="text-sm text-slate-500">Manuell hinzugefügt</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={onImportCsv}
            className="flex items-center gap-2 px-4 py-2 btn-primary px-4 py-2.5 gap-2"
          >
            <Upload className="w-4 h-4" />
            CSV Import
          </button>
          <button
            onClick={onAddResult}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Manuell hinzufügen
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Suchen..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'placement' | 'name')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="placement">Nach Platzierung</option>
            <option value="name">Nach Name</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      {sortedResults.length === 0 ? (
        <div className="card-modern p-8 text-center">
          <div className="text-slate-400 mb-2">
            <Trophy className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Keine Ergebnisse vorhanden</h3>
          <p className="text-slate-500 mb-4">
            Importieren Sie Ergebnisse per CSV oder fügen Sie manuell welche hinzu.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onImportCsv}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              CSV Import
            </button>
            <button
              onClick={onAddResult}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Manuell hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <div className="card-modern overflow-hidden">
          <table className="table-modern">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Platzierung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Athlet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Verein</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Jahrgang</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Punkte</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Herkunft</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedResults.map((result) => (
                <tr 
                  key={result.id} 
                  className={`hover:bg-slate-50 ${getPlacementClass(result.placement)}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPlacementIcon(result.placement)}
                      <span className="font-medium">
                        {getPlacementLabel(result.placement)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {result.athlete ? (
                      <div>
                        <div className="font-medium text-slate-900">
                          {result.athlete.last_name}, {result.athlete.first_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {result.athlete.gender === 'weiblich' ? 'w' : 'm'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unbekannt</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {result.athlete?.club || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {result.athlete?.birth_year || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-green-600">
                      {result.points}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {result.is_manual ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                        Manuell
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded">
                        CSV
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditResult(result)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Bearbeiten"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteResult(result)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}