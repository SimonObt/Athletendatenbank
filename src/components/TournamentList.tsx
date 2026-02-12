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
    
    if (name.includes('let')) return 'bg-indigo-100 text-indigo-700';
    if (name.includes('bem')) return 'bg-emerald-100 text-emerald-700';
    if (name.includes('lem')) return 'bg-purple-100 text-purple-700';
    if (name.includes('wdem')) return 'bg-amber-100 text-amber-700';
    if (name.includes('international')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
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
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Turniere
          <span className="ml-3 text-2xl font-semibold text-slate-500">({sortedTournaments.length})</span>
        </h2>
        <div className="flex gap-3">
          <button
            onClick={onManageLevels}
            className="btn-secondary px-4 py-2.5 gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">Level verwalten</span>
          </button>
          <button
            onClick={onAddNew}
            className="btn-primary px-4 py-2.5 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold">Neues Turnier</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 card-modern p-5">
        <input
          type="text"
          placeholder="Suche nach Name, Ort oder Level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-modern flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TournamentStatus | 'all')}
          className="select-modern min-w-[160px]"
        >
          <option value="all">Alle Status</option>
          <option value="planned">Geplant</option>
          <option value="completed">Abgeschlossen</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="select-modern min-w-[160px]"
        >
          <option value="all">Alle Level</option>
          {tournamentLevels.map(level => (
            <option key={level.id} value={level.id}>{level.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {sortedTournaments.length === 0 ? (
        <div className="text-center py-16 card-modern">
          <p className="text-slate-600 text-lg font-medium">Keine Turniere gefunden</p>
          <p className="text-sm text-slate-400 mt-2">
            {tournaments.length === 0 
              ? 'Legen Sie Ihr erstes Turnier an oder definieren Sie Turnier-Level'
              : 'Passen Sie die Filter an'
            }
          </p>
        </div>
      ) : (
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Turnier</th>
                  <th>Datum</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Punkte</th>
                  <th className="text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {sortedTournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>
                      <div className="font-semibold text-slate-900">
                        {tournament.name}
                        {getDuplicateWarning(tournament) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700" title="Mehrere Turniere mit gleichem Namen und Datum">
                            Duplikat
                          </span>
                        )}
                      </div>
                      {tournament.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {tournament.location}
                        </div>
                      )}
                      {tournament.age_group && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Altersklasse: {tournament.age_group}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(tournament.date)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={`badge-modern ${getLevelColor(tournament.level_id)}`}>
                        {getLevelName(tournament.level_id)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {tournament.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 badge-modern bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Abgeschlossen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 badge-modern bg-amber-100 text-amber-700">
                          <Circle className="w-3.5 h-3.5" />
                          Geplant
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-xs text-slate-600 font-mono">
                        <span className="inline-block w-6">1:</span>{tournament.points_place_1} | 
                        <span className="inline-block w-6 ml-1">2:</span>{tournament.points_place_2} | 
                        <span className="inline-block w-6 ml-1">3:</span>{tournament.points_place_3}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {tournament.status === 'planned' && (
                          <button
                            onClick={() => onComplete(tournament)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-smooth"
                            title="Als abgeschlossen markieren"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(tournament)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-smooth"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tournament)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
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
