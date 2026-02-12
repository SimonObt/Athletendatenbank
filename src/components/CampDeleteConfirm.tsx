'use client';

import { TrainingCamp } from '@/types';
import { AlertTriangle, X } from 'lucide-react';

interface CampDeleteConfirmProps {
  camp: TrainingCamp | null;
  participantCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CampDeleteConfirm({ camp, participantCount, isOpen, onClose, onConfirm }: CampDeleteConfirmProps) {
  if (!isOpen || !camp) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Camp löschen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">
                Möchten Sie das Camp wirklich löschen?
              </p>
              <p className="text-gray-600 text-sm">
                <strong>{camp.name}</strong> wird unwiderruflich gelöscht.
              </p>
              
              {participantCount > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Warnung:</strong> Dieses Camp hat {participantCount} Teilnehmer. 
                    Beim Löschen werden auch alle Teilnehmer-Daten entfernt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
  );
}