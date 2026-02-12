'use client';

import { useState } from 'react';
import { TournamentLevel } from '@/types';
import { X, Trophy, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface TournamentLevelManagerProps {
  levels: TournamentLevel[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (level: Omit<TournamentLevel, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, updates: Partial<TournamentLevel>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string; tournamentsCount?: number }>;
  getTournamentsByLevel: (levelId: string) => { id: string }[];
}

interface LevelFormData {
  name: string;
  points_place_1: number;
  points_place_2: number;
  points_place_3: number;
  points_place_5: number;
  points_place_7: number;
}

const emptyForm: LevelFormData = {
  name: '',
  points_place_1: 0,
  points_place_2: 0,
  points_place_3: 0,
  points_place_5: 0,
  points_place_7: 0,
};

export function TournamentLevelManager({ 
  levels, 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate, 
  onDelete,
  getTournamentsByLevel 
}: TournamentLevelManagerProps) {
  const [editingLevel, setEditingLevel] = useState<TournamentLevel | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<LevelFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TournamentLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData(emptyForm);
    setFormError(null);
    setIsAdding(true);
    setEditingLevel(null);
  };

  const handleStartEdit = (level: TournamentLevel) => {
    setFormData({
      name: level.name,
      points_place_1: level.points_place_1,
      points_place_2: level.points_place_2,
      points_place_3: level.points_place_3,
      points_place_5: level.points_place_5,
      points_place_7: level.points_place_7,
    });
    setFormError(null);
    setEditingLevel(level);
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setIsAdding(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Name ist erforderlich');
      return;
    }

    setIsSubmitting(true);

    if (editingLevel) {
      const result = await onUpdate(editingLevel.id, formData);
      if (result.success) {
        setEditingLevel(null);
      } else {
        setFormError(result.error || 'Fehler beim Aktualisieren');
      }
    } else {
      const result = await onAdd(formData);
      if (result.success) {
        setIsAdding(false);
        setFormData(emptyForm);
      } else {
        setFormError(result.error || 'Fehler beim Hinzufügen');
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    const result = await onDelete(deleteConfirm.id);
    if (!result.success) {
      // Error is handled by showing the tournaments count in the UI
    }
    setDeleteConfirm(null);
  };

  const handleChange = (field: keyof LevelFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTournamentsCount = (levelId: string): number => {
    return getTournamentsByLevel(levelId).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            Turnier-Level verwalten
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Turnier-Level definieren die Punktewerte für verschiedene Turnier-Typen. 
              Beim Anlegen eines Turniers werden die Punkte vom gewählten Level kopiert.
            </p>
          </div>

          {/* Add New Button */}
          {!isAdding && !editingLevel && (
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neues Level
            </button>
          )}

          {/* Form */}
          {(isAdding || editingLevel) && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                {editingLevel ? 'Level bearbeiten' : 'Neues Level'}
              </h3>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. LET U14"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    1. Platz
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points_place_1}
                    onChange={(e) => handleChange('points_place_1', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. Platz
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points_place_2}
                    onChange={(e) => handleChange('points_place_2', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. Platz
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points_place_3}
                    onChange={(e) => handleChange('points_place_3', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    5. Platz
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points_place_5}
                    onChange={(e) => handleChange('points_place_5', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    7. Platz
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.points_place_7}
                    onChange={(e) => handleChange('points_place_7', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Speichern...' : (editingLevel ? 'Aktualisieren' : 'Hinzufügen')}
                </button>
              </div>
            </form>
          )}

          {/* Levels Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">1. Platz</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">2. Platz</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">3. Platz</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">5. Platz</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">7. Platz</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Verwendung</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {levels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Keine Turnier-Level definiert
                    </td>
                  </tr>
                ) : (
                  levels.sort((a, b) => a.name.localeCompare(b.name)).map((level) => {
                    const usageCount = getTournamentsCount(level.id);
                    return (
                      <tr key={level.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {level.name}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{level.points_place_1}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{level.points_place_2}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{level.points_place_3}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{level.points_place_5}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{level.points_place_7}</td>
                        <td className="px-4 py-3 text-center">
                          {usageCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              {usageCount} Turnier{usageCount !== 1 ? 'e' : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(level)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Bearbeiten"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(level)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Löschen"
                              disabled={usageCount > 0}
                            >
                              <Trash2 className={`w-4 h-4 ${usageCount > 0 ? 'opacity-50' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {getTournamentsCount(deleteConfirm.id) > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-4 text-yellow-600">
                    <AlertTriangle className="w-8 h-8" />
                    <span className="font-medium">Level kann nicht gelöscht werden</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Das Level <strong>{deleteConfirm.name}</strong> wird von{' '}
                    <strong>{getTournamentsCount(deleteConfirm.id)} Turnieren</strong> verwendet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Bitte löschen Sie zuerst die zugehörigen Turniere oder ändern Sie deren Level, 
                    bevor Sie dieses Level löschen.
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Verstanden
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertTriangle className="w-8 h-8" />
                    <span className="font-medium">Level löschen</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Möchten Sie das Level <strong>{deleteConfirm.name}</strong> wirklich löschen?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
