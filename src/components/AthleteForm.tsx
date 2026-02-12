'use client';

import { useState, useEffect } from 'react';
import { Athlete } from '@/types';
import { validateEmail, validatePhone } from '@/lib/utils';
import { X } from 'lucide-react';

interface AthleteFormProps {
  athlete?: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Athlete, 'id' | 'import_id' | 'created_at' | 'updated_at'>) => void;
  error?: string | null;
}

interface FormData {
  first_name: string;
  last_name: string;
  gender: 'männlich' | 'weiblich' | 'divers';
  birth_year: number;
  district: string;
  club: string;
  phone: string;
  email: string;
}

const emptyForm: FormData = {
  first_name: '',
  last_name: '',
  gender: 'männlich',
  birth_year: new Date().getFullYear() - 10,
  district: '',
  club: '',
  phone: '',
  email: '',
};

export function AthleteForm({ athlete, isOpen, onClose, onSave, error }: AthleteFormProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (athlete) {
      setFormData({
        first_name: athlete.first_name,
        last_name: athlete.last_name,
        gender: athlete.gender,
        birth_year: athlete.birth_year,
        district: athlete.district || '',
        club: athlete.club || '',
        phone: athlete.phone || '',
        email: athlete.email || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setFormError(null);
  }, [athlete, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.first_name.trim()) {
      setFormError('Vorname ist erforderlich');
      return;
    }
    if (!formData.last_name.trim()) {
      setFormError('Nachname ist erforderlich');
      return;
    }
    if (!formData.birth_year || formData.birth_year < 1900 || formData.birth_year > 2030) {
      setFormError('Jahrgang muss zwischen 1900 und 2030 liegen');
      return;
    }

    // BUG-3 Fix: Email/Telefon-Validierung
    if (formData.email && !validateEmail(formData.email)) {
      setFormError('Bitte eine gültige Email-Adresse eingeben');
      return;
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      setFormError('Bitte eine gültige Telefonnummer eingeben');
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            {athlete ? 'Athlet bearbeiten' : 'Neuer Athlet'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vorname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nachname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Geschlecht <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="männlich">Männlich</option>
                <option value="weiblich">Weiblich</option>
                <option value="divers">Divers</option>
              </select>
            </div>

            {/* Birth Year */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jahrgang <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={formData.birth_year}
                onChange={(e) => handleChange('birth_year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bezirk
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="z.B. Köln"
              />
            </div>

            {/* Club */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Verein
              </label>
              <input
                type="text"
                value={formData.club}
                onChange={(e) => handleChange('club', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="z.B. Judo Club Köln"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0151/12345678"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="max@example.com"
              />
            </div>
          </div>

          {athlete && (
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
              <strong>Import-ID:</strong> {athlete.import_id}
              <br />
              <span className="text-xs">(Die Import-ID ändert sich nicht, auch wenn Name oder Jahrgang geändert werden)</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {athlete ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
