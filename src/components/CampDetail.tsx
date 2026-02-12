'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrainingCamp, TrainingCampWithDetails, CampParticipantWithDetails, ParticipantStatus } from '@/types';
import { useTrainingCamps } from '@/hooks/useTrainingCamps';
import { ParticipantList } from './ParticipantList';
import { NominationModal } from './NominationModal';
import { EmailExport } from './EmailExport';
import { CampDeleteConfirm } from './CampDeleteConfirm';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus, 
  ChevronLeft,
  AlertCircle,
  Euro
} from 'lucide-react';

interface CampDetailProps {
  camp: TrainingCamp;
  athletes: { id: string; first_name: string; last_name: string; club?: string; email?: string }[];
  onBack: () => void;
  onEdit: (camp: TrainingCamp) => void;
  onDelete: (camp: TrainingCamp) => void;
}

const statusColors: Record<string, string> = {
  'geplant': 'bg-gray-100 text-gray-800',
  'nominierung': 'bg-yellow-100 text-yellow-800',
  'bestätigt': 'bg-blue-100 text-blue-800',
  'abgeschlossen': 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  'geplant': 'Geplant',
  'nominierung': 'Nominierung',
  'bestätigt': 'Bestätigt',
  'abgeschlossen': 'Abgeschlossen',
};

export function CampDetail({ camp, athletes, onBack, onEdit, onDelete }: CampDetailProps) {
  const [campWithDetails, setCampWithDetails] = useState<TrainingCampWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNominationOpen, setIsNominationOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    vorgeschlagen: 0,
    eingeladen: 0,
    zugesagt: 0,
    abgesagt: 0,
    nachgerueckt: 0,
  });

  const { getCampById, updateParticipantStatus, removeParticipant, getCampStats } = useTrainingCamps();

  const loadCampDetails = useCallback(async () => {
    setIsLoading(true);
    const details = await getCampById(camp.id);
    setCampWithDetails(details);
    
    if (details) {
      const campStats = await getCampStats(camp.id);
      setStats(campStats);
    }
    
    setIsLoading(false);
  }, [camp.id, getCampById, getCampStats]);

  useEffect(() => {
    loadCampDetails();
  }, [loadCampDetails]);

  const handleStatusChange = async (participantId: string, newStatus: ParticipantStatus) => {
    await updateParticipantStatus(participantId, newStatus);
    await loadCampDetails();
  };

  const handleRemoveParticipant = async (participantId: string) => {
    await removeParticipant(participantId);
    await loadCampDetails();
  };

  const handleNominationSuccess = async () => {
    setIsNominationOpen(false);
    await loadCampDetails();
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()}. - ${end.getDate()}. ${start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
    }
    
    return `${start.toLocaleDateString('de-DE')} - ${end.toLocaleDateString('de-DE')}`;
  };

  const capacityPercentage = camp.capacity && stats.zugesagt > 0
    ? Math.round((stats.zugesagt / camp.capacity) * 100)
    : 0;

  const isFull = camp.capacity ? stats.zugesagt >= camp.capacity : false;
  const isNearlyFull = camp.capacity ? stats.zugesagt >= camp.capacity * 0.9 : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Zurück zur Übersicht
      </button>

      {/* Camp Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{camp.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[camp.status]}`}>
                {statusLabels[camp.status]}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
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
              
              {camp.cost_per_person && (
                <span className="flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {camp.cost_per_person} € pro Person
                </span>
              )}
            </div>

            {camp.description && (
              <p className="mt-4 text-gray-700">{camp.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(camp)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          </div>
        </div>

        {/* Capacity Warning */}
        {camp.capacity && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Auslastung: {stats.zugesagt} von {camp.capacity} Plätzen
              </span>
              <span className={`text-sm font-medium ${
                isFull ? 'text-red-600' : isNearlyFull ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {capacityPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  isFull ? 'bg-red-500' : isNearlyFull ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
            {isFull && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                Das Camp ist voll. Neue Athleten können nur als Nachrücker hinzugefügt werden.
              </div>
            )}
            {isNearlyFull && !isFull && (
              <div className="mt-2 flex items-center gap-2 text-sm text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                Nur noch {camp.capacity - stats.zugesagt} Plätze verfügbar!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Gesamt</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.vorgeschlagen}</div>
          <div className="text-sm text-gray-600">Vorgeschlagen</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.eingeladen}</div>
          <div className="text-sm text-gray-600">Eingeladen</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.zugesagt}</div>
          <div className="text-sm text-gray-600">Zugesagt</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.abgesagt}</div>
          <div className="text-sm text-gray-600">Abgesagt</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Teilnehmer</h2>
        <div className="flex items-center gap-2">
          {campWithDetails?.participants && campWithDetails.participants.length > 0 && (
            <EmailExport
              participants={campWithDetails.participants}
              campName={camp.name}
            />
          )}
          <button
            onClick={() => setIsNominationOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Athlet hinzufügen
          </button>
        </div>
      </div>

      {/* Participants List */}
      {campWithDetails?.participants ? (
        <ParticipantList
          participants={campWithDetails.participants}
          onStatusChange={handleStatusChange}
          onRemove={handleRemoveParticipant}
          isFull={isFull}
          capacity={camp.capacity}
          confirmedCount={stats.zugesagt}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Teilnehmer</h3>
          <p className="text-gray-500 mb-4">
            Es wurden noch keine Athleten zu diesem Camp hinzugefügt.
          </p>
          <button
            onClick={() => setIsNominationOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ersten Athleten hinzufügen
          </button>
        </div>
      )}

      {/* Modals */}
      <NominationModal
        isOpen={isNominationOpen}
        onClose={() => setIsNominationOpen(false)}
        campId={camp.id}
        athletes={athletes}
        isFull={isFull}
        onSuccess={handleNominationSuccess}
      />

      <CampDeleteConfirm
        camp={camp}
        participantCount={stats.total}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => onDelete(camp)}
      />
    </div>
  );
}