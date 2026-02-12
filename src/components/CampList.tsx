'use client';

import { useState, useMemo } from 'react';
import { TrainingCamp, CampStatus } from '@/types';
import { Calendar, MapPin, Users, Plus, Search, Filter, Copy, Trash2, Edit, ChevronRight } from 'lucide-react';

interface CampListProps {
  camps: TrainingCamp[];
  onEdit: (camp: TrainingCamp) => void;
  onDelete: (camp: TrainingCamp) => void;
  onAddNew: () => void;
  onDuplicate: (camp: TrainingCamp) => void;
  onSelect: (camp: TrainingCamp) => void;
}

const statusColors: Record<CampStatus, string> = {
  'geplant': 'bg-gray-100 text-gray-800',
  'nominierung': 'bg-yellow-100 text-yellow-800',
  'bestätigt': 'bg-blue-100 text-blue-800',
  'abgeschlossen': 'bg-green-100 text-green-800',
};

const statusLabels: Record<CampStatus, string> = {
  'geplant': 'Geplant',
  'nominierung': 'Nominierung',
  'bestätigt': 'Bestätigt',
  'abgeschlossen': 'Abgeschlossen',
};

export function CampList({ camps, onEdit, onDelete, onAddNew, onDuplicate, onSelect }: CampListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampStatus | 'all'>('all');

  const filteredCamps = useMemo(() => {
    return camps.filter(camp => {
      const matchesSearch = searchTerm === '' || 
        camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (camp.location && camp.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [camps, searchTerm, statusFilter]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()}. - ${end.getDate()}. ${start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
    }
    
    return `${start.toLocaleDateString('de-DE')} - ${end.toLocaleDateString('de-DE')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Trainingscamps</h2>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Camp
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Camp suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Status</option>
            <option value="geplant">Geplant</option>
            <option value="nominierung">Nominierung</option>
            <option value="bestätigt">Bestätigt</option>
            <option value="abgeschlossen">Abgeschlossen</option>
          </select>
        </div>
      </div>

      {/* Camp List */}
      {filteredCamps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Trainingscamps</h3>
          <p className="text-gray-500 mb-4">
            {camps.length === 0 
              ? 'Es wurden noch keine Trainingscamps angelegt.'
              : 'Keine Camps entsprechen den Filterkriterien.'}
          </p>
          {camps.length === 0 && (
            <button
              onClick={onAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Erstes Camp anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredCamps.map((camp) => (
              <div
                key={camp.id}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => onSelect(camp)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {camp.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[camp.status]}`}>
                        {statusLabels[camp.status]}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(camp.start_date, camp.end_date)}
                      </span>
                      
                      {camp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {camp.location}
                        </span>
                      )}
                      
                      {camp.capacity && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Max. {camp.capacity} Plätze
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(camp);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplizieren"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(camp);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(camp);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}