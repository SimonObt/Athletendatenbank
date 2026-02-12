'use client';

import { TournamentResultWithDetails } from '@/types';
import { X, AlertTriangle } from 'lucide-react';
import { getPlacementLabel } from '@/hooks/useResults';

interface ResultDeleteConfirmProps {
  result: TournamentResultWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResultDeleteConfirm({ result, isOpen, onClose, onConfirm }: ResultDeleteConfirmProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Ergebnis löschen
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-slate-700">
                Möchten Sie dieses Ergebnis wirklich löschen?
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Athlet:</span>
                <span className="font-medium">
                  {result.athlete 
                    ? `${result.athlete.last_name}, ${result.athlete.first_name}`
                    : 'Unbekannt'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Platzierung:</span>
                <span className="font-medium">{getPlacementLabel(result.placement)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Punkte:</span>
                <span className="font-medium text-green-600">{result.points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Turnier:</span>
                <span className="font-medium">{result.tournament?.name || 'Unbekannt'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}