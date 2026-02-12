'use client';

import { useState, useMemo } from 'react';
import { Tournament, TournamentLevel, TournamentStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { Pencil, Trash2, Plus, Trophy, MapPin, Calendar, CheckCircle, Circle } from 'lucide-react';

interface TournamentListProps {
  tournaments: Tournament[];
  tournamentLevels: TournamentLevel[];
  onEdit: (tournament: Tournament) => void;
  onDelete: (tournament: Tournament) => void;
  onAddNew: () => void;
  onManageLevels: () => void;
  onComplete: (tournament: Tournament) => void;
}

export function TournamentList({ 
  tournaments, 
  tournamentLevels, 
  onEdit, 
  onDelete, 
  onAddNew, 
  onManageLevels,
  onComplete 
}: TournamentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Get level name by ID
  const getLevelName = (levelId: string) => {
    const level = tournamentLevels.find(l => l.id === levelId);
    return level?.name || 'Unbekanntes Level';
  };

  // Get level color based on name
  const getLevelColor = (levelId: string) => {
    const level = tournamentLevels.find(l => l.id === levelId);
    const name = level?.name?.toLowerCase() || '';
    
    if (name.includes('let')) return 'bg-blue-100 text-blue-800';
    if (name.includes('bem')) return 'bg-green-100 text-green-800';
    if (name.includes('lem')) return 'bg-purple-100 text-purple-800';
    if (name.includes('wdem')) return 'bg-orange-100 text-orange-800';
    if (name.includes('international')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Filter tournaments
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      const matchesSearch = 
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tournament.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        getLevelName(tournament.level_id).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
      const matchesLevel = levelFilter === 'all' || tournament.level_id === levelFilter;
      
      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [tournaments, searchTerm, statusFilter, levelFilter, tournamentLevels]);

  // Sort by date (newest first)
  const sortedTournaments = useMemo(() => {
    return [...filteredTournaments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTournaments]);

  // Check for duplicate tournaments (same name + date)
  const getDuplicateWarning = (tournament: Tournament): boolean => {
    return tournaments.some(t => 
      t.id !== tournament.id && 
      t.name === tournament.name && 
      t.date === tournament.date
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Turniere ({sortedTournaments.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onManageLevels}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Level verwalten
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neues Turnier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Suche nach Name, Ort oder Level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TournamentStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Status</option>
          <option value="planned">Geplant</option>
          <option value="completed">Abgeschlossen</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Level</option>
          {tournamentLevels.map(level => (
            <option key={level.id} value={level.id}>{level.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {sortedTournaments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Keine Turniere gefunden</p>
          <p className="text-sm text-gray-400 mt-1">
            {tournaments.length === 0 
              ? 'Legen Sie Ihr erstes Turnier an oder definieren Sie Turnier-Level'
              : 'Passen Sie die Filter an'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punkte</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTournaments.map((tournament) => (
                  <tr key={tournament.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {tournament.name}
                        {getDuplicateWarning(tournament) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800" title="Mehrere Turniere mit gleichem Namen und Datum">
                            Duplikat
                          </span>
                        )}
                      </div>
                      {tournament.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {tournament.location}
                        </div>
                      )}
                      {tournament.age_group && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Altersklasse: {tournament.age_group}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(tournament.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getLevelColor(tournament.level_id)}`}>
                        {getLevelName(tournament.level_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tournament.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Abgeschlossen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          <Circle className="w-3 h-3" />
                          Geplant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        <span className="inline-block w-6">1:</span>{tournament.points_place_1} | 
                        <span className="inline-block w-6 ml-1">2:</span>{tournament.points_place_2} | 
                        <span className="inline-block w-6 ml-1">3:</span>{tournament.points_place_3}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {tournament.status === 'planned' && (
                          <button
                            onClick={() => onComplete(tournament)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Als abgeschlossen markieren"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(tournament)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tournament)}
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
        </div>
      )}
    </div>
  );
}
