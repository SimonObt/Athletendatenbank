'use client';

import { useState, useEffect } from 'react';
import { TrainingCamp, CampStatus } from '@/types';
import { X, AlertTriangle } from 'lucide-react';

interface CampFormProps {
  camp?: TrainingCamp | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<TrainingCamp, 'id' | 'created_at' | 'updated_at'>) => void;
  error?: string | null;
}

interface FormData {
  name: string;
  start_date: string;
  end_date: string;
  status: CampStatus;
  location: string;
  description: string;
  capacity: number | '';
  cost_per_person: number | '';
  registration_deadline: string;
}

const emptyForm: FormData = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'geplant',
  location: '',
  description: '',
  capacity: '',
  cost_per_person: '',
  registration_deadline: '',
};

const statusOptions: { value: CampStatus; label: string }[] = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'nominierung', label: 'Nominierung' },
  { value: 'bestätigt', label: 'Bestätigt' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
];

export function CampForm({ camp, isOpen, onClose, onSave, error }: CampFormProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);

  useEffect(() => {
    if (camp) {
      setFormData({
        name: camp.name,
        start_date: camp.start_date.slice(0, 10),
        end_date: camp.end_date.slice(0, 10),
        status: camp.status,
        location: camp.location || '',
        description: camp.description || '',
        capacity: camp.capacity || '',
        cost_per_person: camp.cost_per_person || '',
        registration_deadline: camp.registration_deadline?.slice(0, 10) || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setFormError(null);
    setShowPastDateWarning(false);
  }, [camp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Camp-Name ist erforderlich');
      return;
    }
    if (!formData.start_date) {
      setFormError('Start-Datum ist erforderlich');
      return;
    }
    if (!formData.end_date) {
      setFormError('End-Datum ist erforderlich');
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      setFormError('End-Datum muss nach dem Start-Datum liegen');
      return;
    }

    // Check if dates are in the past
    if (endDate < today && !showPastDateWarning) {
      setShowPastDateWarning(true);
      return;
    }

    onSave({
      name: formData.name.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
      capacity: formData.capacity === '' ? undefined : Number(formData.capacity),
      cost_per_person: formData.cost_per_person === '' ? undefined : Number(formData.cost_per_person),
      registration_deadline: formData.registration_deadline || undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowPastDateWarning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {camp ? 'Camp bearbeiten' : 'Neues Trainingscamp'}
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

          {showPastDateWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Das Datum liegt in der Vergangenheit</p>
                <p className="text-sm mt-1">Möchten Sie trotzdem fortfahren?</p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPastDateWarning(false)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Trotzdem speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camp-Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. Winter-Trainingscamp 2025"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start-Datum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End-Datum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                placeholder="z.B. Sportzentrum Köln"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapazität (max. Athleten)
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0 = unbegrenzt"
              />
            </div>

            {/* Cost per person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kosten pro Person (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_person}
                onChange={(e) => handleChange('cost_per_person', e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anmelde-Deadline
              </label>
              <input
                type="date"
                value={formData.registration_deadline}
                onChange={(e) => handleChange('registration_deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Details zum Camp..."
              />
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
              {camp ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}