'use client';

import { useState, useEffect } from 'react';
import { Tournament, TournamentLevel } from '@/types';
import { X, Trophy } from 'lucide-react';

interface TournamentFormProps {
  tournament?: Tournament | null;
  tournamentLevels: TournamentLevel[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>) => void;
  error?: string | null;
}

interface FormData {
  name: string;
  level_id: string;
  date: string;
  location: string;
  description: string;
  age_group: string;
  status: 'planned' | 'completed';
  points_place_1: number;
  points_place_2: number;
  points_place_3: number;
  points_place_5: number;
  points_place_7: number;
}

const emptyForm: FormData = {
  name: '',
  level_id: '',
  date: '',
  location: '',
  description: '',
  age_group: '',
  status: 'planned',
  points_place_1: 0,
  points_place_2: 0,
  points_place_3: 0,
  points_place_5: 0,
  points_place_7: 0,
};

const ageGroups = ['U11', 'U13', 'U15', 'U18', 'U21', 'Senior'];

export function TournamentForm({ tournament, tournamentLevels, isOpen, onClose, onSave, error }: TournamentFormProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name,
        level_id: tournament.level_id,
        date: tournament.date,
        location: tournament.location || '',
        description: tournament.description || '',
        age_group: tournament.age_group || '',
        status: tournament.status,
        points_place_1: tournament.points_place_1,
        points_place_2: tournament.points_place_2,
        points_place_3: tournament.points_place_3,
        points_place_5: tournament.points_place_5,
        points_place_7: tournament.points_place_7,
      });
    } else {
      setFormData(emptyForm);
    }
    setFormError(null);
  }, [tournament, isOpen]);

  // Auto-fill points when level is selected
  useEffect(() => {
    if (!tournament && formData.level_id) {
      const selectedLevel = tournamentLevels.find(l => l.id === formData.level_id);
      if (selectedLevel) {
        setFormData(prev => ({
          ...prev,
          points_place_1: selectedLevel.points_place_1,
          points_place_2: selectedLevel.points_place_2,
          points_place_3: selectedLevel.points_place_3,
          points_place_5: selectedLevel.points_place_5,
          points_place_7: selectedLevel.points_place_7,
        }));
      }
    }
  }, [formData.level_id, tournamentLevels, tournament]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Turniername ist erforderlich');
      return;
    }
    if (!formData.level_id) {
      setFormError('Bitte wählen Sie ein Turnier-Level');
      return;
    }
    if (!formData.date) {
      setFormError('Datum ist erforderlich');
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedLevel = tournamentLevels.find(l => l.id === formData.level_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            {tournament ? 'Turnier bearbeiten' : 'Neues Turnier'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(formError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formError || error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Turnier-Informationen</h3>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turniername <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. LET Köln 2024"
                  required
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turnier-Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.level_id}
                  onChange={(e) => handleChange('level_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {tournamentLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
                {selectedLevel && (
                  <p className="text-xs text-gray-500 mt-1">
                    Punkte werden automatisch vom Level übernommen (können angepasst werden)
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Köln"
                />
              </div>

              {/* Age Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Altersklasse
                </label>
                <select
                  value={formData.age_group}
                  onChange={(e) => handleChange('age_group', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Bitte wählen...</option>
                  {ageGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planned">Geplant</option>
                  <option value="completed">Abgeschlossen</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Zusätzliche Informationen zum Turnier..."
                />
              </div>
            </div>

            {/* Right Column - Points */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Punkte-System</h3>
              <p className="text-xs text-gray-500">
                Diese Punkte werden Athleten basierend auf ihrer Platzierung zugewiesen.
                {selectedLevel && ' Voreingestellte Werte vom gewählten Level.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Place 1 */}
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

                {/* Place 2 */}
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

                {/* Place 3 */}
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

                {/* Place 5 */}
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

                {/* Place 7 */}
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

              {selectedLevel && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Level-Vorlage:</strong> {selectedLevel.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Standard: 1.={selectedLevel.points_place_1}, 2.={selectedLevel.points_place_2}, 3.={selectedLevel.points_place_3}, 5.={selectedLevel.points_place_5}, 7.={selectedLevel.points_place_7}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tournament ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
