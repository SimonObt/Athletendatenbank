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
        <h2 className="text-2xl font-bold text-gray-900">Athleten ({sortedAthletes.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={onImportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4" />
            CSV Import
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Neuer Athlet
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <input
          type="text"
          placeholder="Suche nach Name oder Verein..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Geschlechter</option>
          <option value="männlich">Männlich</option>
          <option value="weiblich">Weiblich</option>
          <option value="divers">Divers</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Alle Jahrgänge</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {sortedAthletes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Keine Athleten gefunden</p>
          <p className="text-sm text-gray-400 mt-1">
            {athletes.length === 0 
              ? 'Legen Sie Ihren ersten Athleten an oder importieren Sie CSV-Daten'
              : 'Passen Sie die Filter an'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jahrgang</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geschlecht</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verein</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bezirk</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedAthletes.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {athlete.last_name}, {athlete.first_name}
                      </div>
                      {athlete.email && (
                        <div className="text-xs text-gray-500">{athlete.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">{athlete.birth_year}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        athlete.gender === 'männlich' ? 'bg-blue-100 text-blue-800' :
                        athlete.gender === 'weiblich' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {athlete.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{athlete.club || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{athlete.district || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(athlete)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(athlete)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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
