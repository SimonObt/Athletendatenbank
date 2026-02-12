'use client';

import { useState } from 'react';
import { Athlete } from '@/types';
import { Pencil, Trash2, UserPlus, Upload } from 'lucide-react';

interface AthleteListProps {
  athletes: Athlete[];
  onEdit: (athlete: Athlete) => void;
  onDelete: (athlete: Athlete) => void;
  onAddNew: () => void;
  onImportCsv: () => void;
}

export function AthleteList({ athletes, onEdit, onDelete, onAddNew, onImportCsv }: AthleteListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Get unique years for filter
  const years = [...new Set(athletes.map(a => a.birth_year))].sort((a, b) => b - a);

  // Filter athletes
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = 
      athlete.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.club?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || athlete.gender === genderFilter;
    const matchesYear = yearFilter === 'all' || athlete.birth_year.toString() === yearFilter;
    
    return matchesSearch && matchesGender && matchesYear;
  });

  // Sort by last name
  const sortedAthletes = filteredAthletes.sort((a, b) => 
    a.last_name.localeCompare(b.last_name)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Athleten 
          <span className="ml-3 text-2xl font-semibold text-slate-500">({sortedAthletes.length})</span>
        </h2>
        <div className="flex gap-3">
          <button
            onClick={onImportCsv}
            className="btn-secondary px-4 py-2.5 gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="font-semibold">CSV Import</span>
          </button>
          <button
            onClick={onAddNew}
            className="btn-primary px-4 py-2.5 gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="font-semibold">Neuer Athlet</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 card-modern p-5">
        <input
          type="text"
          placeholder="Suche nach Name oder Verein..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-modern flex-1"
        />
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="select-modern min-w-[160px]"
        >
          <option value="all">Alle Geschlechter</option>
          <option value="männlich">Männlich</option>
          <option value="weiblich">Weiblich</option>
          <option value="divers">Divers</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="select-modern min-w-[160px]"
        >
          <option value="all">Alle Jahrgänge</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {sortedAthletes.length === 0 ? (
        <div className="text-center py-16 card-modern">
          <p className="text-slate-600 text-lg font-medium">Keine Athleten gefunden</p>
          <p className="text-sm text-slate-400 mt-2">
            {athletes.length === 0 
              ? 'Legen Sie Ihren ersten Athleten an oder importieren Sie CSV-Daten'
              : 'Passen Sie die Filter an'}
          </p>
        </div>
      ) : (
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Jahrgang</th>
                  <th>Geschlecht</th>
                  <th>Verein</th>
                  <th>Bezirk</th>
                  <th className="text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {sortedAthletes.map((athlete) => (
                  <tr key={athlete.id}>
                    <td>
                      <div className="font-semibold text-slate-900">
                        {athlete.last_name}, {athlete.first_name}
                      </div>
                      {athlete.email && (
                        <div className="text-xs text-slate-500 mt-0.5">{athlete.email}</div>
                      )}
                    </td>
                    <td className="text-slate-900 font-medium">{athlete.birth_year}</td>
                    <td>
                      <span className={`badge-modern ${
                        athlete.gender === 'männlich' ? 'bg-indigo-100 text-indigo-700' :
                        athlete.gender === 'weiblich' ? 'bg-pink-100 text-pink-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {athlete.gender}
                      </span>
                    </td>
                    <td className="text-slate-600">{athlete.club || '-'}</td>
                    <td className="text-slate-600">{athlete.district || '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(athlete)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-smooth"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(athlete)}
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
