'use client';

import { useState, useMemo } from 'react';
import { ParticipantStatus } from '@/types';
import { useTrainingCamps } from '@/hooks/useTrainingCamps';
import { X, Search, AlertCircle, Check, UserPlus } from 'lucide-react';

interface NominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: string;
  athletes: { id: string; first_name: string; last_name: string; club?: string; email?: string; birth_year?: number }[];
  isFull: boolean;
  onSuccess: () => void;
}

const statusOptions: { value: ParticipantStatus; label: string }[] = [
  { value: 'vorgeschlagen', label: 'Vorgeschlagen' },
  { value: 'eingeladen', label: 'Eingeladen' },
  { value: 'zugesagt', label: 'Zugesagt' },
  { value: 'nachgerückt', label: 'Nachgerückt' },
];

export function NominationModal({ 
  isOpen, 
  onClose, 
  campId, 
  athletes, 
  isFull, 
  onSuccess 
}: NominationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<ParticipantStatus>('vorgeschlagen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { nominateAthlete } = useTrainingCamps();

  // Filter out athletes that are already in the camp (would need to fetch current participants)
  // For now, we show all athletes
  const filteredAthletes = useMemo(() => {
    if (!searchTerm.trim()) return athletes;
    
    const searchLower = searchTerm.toLowerCase();
    return athletes.filter(athlete => 
      athlete.first_name.toLowerCase().includes(searchLower) ||
      athlete.last_name.toLowerCase().includes(searchLower) ||
      (athlete.club && athlete.club.toLowerCase().includes(searchLower))
    );
  }, [athletes, searchTerm]);

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId);
      } else {
        newSet.add(athleteId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedAthletes.size === 0) {
      setError('Bitte wählen Sie mindestens einen Athleten aus');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    let successCount = 0;
    let errorCount = 0;

    for (const athleteId of selectedAthletes) {
      // If camp is full and status is 'zugesagt', change to 'nachgerückt'
      let status = selectedStatus;
      if (isFull && status === 'zugesagt') {
        status = 'nachgerückt';
      }

      const result = await nominateAthlete(campId, athleteId, status);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      setSuccessMessage(`${successCount} Athlet(en) erfolgreich hinzugefügt`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }

    if (errorCount > 0) {
      setError(`${errorCount} Athlet(en) konnten nicht hinzugefügt werden (möglicherweise bereits im Camp)`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Athleten hinzufügen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Status Selection */}
          <div className="p-4 border-b bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status für neue Teilnehmer
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isFull && selectedStatus === 'zugesagt' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Das Camp ist voll. Neue Athleten werden als Nachrücker hinzugefügt.
              </div>
            )}
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Athleten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Athletes List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAthletes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Keine Athleten gefunden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    onClick={() => toggleAthleteSelection(athlete.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAthletes.has(athlete.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      selectedAthletes.has(athlete.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedAthletes.has(athlete.id) && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {athlete.first_name[0]}{athlete.last_name[0]}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {athlete.first_name} {athlete.last_name}
                      </div>
                      {athlete.club && (
                        <div className="text-sm text-gray-500">
                          {athlete.club}
                        </div>
                      )}
                    </div>
                    
                    {athlete.birth_year && (
                      <div className="text-sm text-gray-400">
                        Jg. {athlete.birth_year}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          {(error || successMessage) && (
            <div className="px-4 py-3 border-t">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {successMessage}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedAthletes.size} Athlet(en) ausgewählt
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedAthletes.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}