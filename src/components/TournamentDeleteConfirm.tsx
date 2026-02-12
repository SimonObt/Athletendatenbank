'use client';

import { Tournament, TournamentLevel } from '@/types';
import { AlertTriangle, X, Trophy, Calendar } from 'lucide-react';

interface TournamentDeleteConfirmProps {
  tournament: Tournament | null;
  tournamentLevel: TournamentLevel | undefined;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TournamentDeleteConfirm({ tournament, tournamentLevel, isOpen, onClose, onConfirm }: TournamentDeleteConfirmProps) {
  if (!isOpen || !tournament) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Turnier löschen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle className="w-8 h-8" />
            <span className="font-medium">Diese Aktion kann nicht rückgängig gemacht werden!</span>
          </div>

          <p className="text-gray-600 mb-4">
            Möchten Sie das folgende Turnier wirklich löschen?
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 font-medium text-gray-900 mb-2">
              <Trophy className="w-4 h-4 text-blue-600" />
              {tournament.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              {new Date(tournament.date).toLocaleDateString('de-DE')}
            </div>
            {tournamentLevel && (
              <div className="text-sm text-gray-600">
                Level: {tournamentLevel.name}
              </div>
            )}
            {tournament.location && (
              <div className="text-sm text-gray-600">
                Ort: {tournament.location}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Punkte: 1.={tournament.points_place_1}, 2.={tournament.points_place_2}, 3.={tournament.points_place_3}, 5.={tournament.points_place_5}, 7.={tournament.points_place_7}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
