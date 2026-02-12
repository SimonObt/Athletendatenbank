'use client';

import { Athlete } from '@/types';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirm({ athlete, isOpen, onClose, onConfirm }: DeleteConfirmProps) {
  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            Athlet löschen
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertTriangle className="w-8 h-8" />
            <span className="font-medium">Diese Aktion kann nicht rückgängig gemacht werden!</span>
          </div>

          <p className="text-slate-600 mb-4">
            Möchten Sie den folgenden Athleten wirklich löschen?
          </p>

          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <p className="font-medium text-slate-900">
              {athlete.last_name}, {athlete.first_name}
            </p>
            <p className="text-sm text-slate-500">
              Jahrgang: {athlete.birth_year} | Geschlecht: {athlete.gender}
            </p>
            {athlete.club && (
              <p className="text-sm text-slate-500">Verein: {athlete.club}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
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
