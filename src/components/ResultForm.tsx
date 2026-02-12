'use client';

import { useState, useEffect, useMemo } from 'react';
import { TournamentResult, TournamentResultWithDetails, Tournament, Athlete, Placement } from '@/types';
import { calculatePoints, getPlacementLabel, isValidPlacement, VALID_PLACEMENTS } from '@/hooks/useResults';
import { X, Search, Check } from 'lucide-react';

interface ResultFormProps {
  result?: TournamentResultWithDetails | null;
  tournament: Tournament;
  athletes: Athlete[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<TournamentResult, 'id' | 'created_at' | 'updated_at'>) => void;
  error?: string | null;
}

export function ResultForm({ 
  result, 
  tournament, 
  athletes, 
  isOpen, 
  onClose, 
  onSave,
  error 
}: ResultFormProps) {
  const isEditing = !!result;
  
  const [athleteSearch, setAthleteSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [placement, setPlacement] = useState<Placement>(1);
  const [manualPoints, setManualPoints] = useState<number | ''>('');
  const [useManualPoints, setUseManualPoints] = useState(false);
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);

  // Filter athletes based on search
  const filteredAthletes = useMemo(() => {
    if (!athleteSearch) return athletes.slice(0, 10);
    const searchLower = athleteSearch.toLowerCase();
    return athletes.filter(athlete => 
      `${athlete.first_name} ${athlete.last_name}`.toLowerCase().includes(searchLower) ||
      `${athlete.last_name} ${athlete.first_name}`.toLowerCase().includes(searchLower) ||
      athlete.club?.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [athleteSearch, athletes]);

  // Calculate auto points
  const autoPoints = useMemo(() => {
    return calculatePoints(placement, tournament);
  }, [placement, tournament]);

  // Final points value
  const finalPoints = useManualPoints && manualPoints !== '' ? manualPoints : autoPoints;

  // Initialize form when editing
  useEffect(() => {
    if (result) {
      setSelectedAthlete(result.athlete || null);
      setAthleteSearch(result.athlete ? `${result.athlete.last_name}, ${result.athlete.first_name}` : '');
      setPlacement(result.placement);
      if (result.points !== calculatePoints(result.placement, tournament)) {
        setManualPoints(result.points);
        setUseManualPoints(true);
      } else {
        setManualPoints('');
        setUseManualPoints(false);
      }
    } else {
      setSelectedAthlete(null);
      setAthleteSearch('');
      setPlacement(1);
      setManualPoints('');
      setUseManualPoints(false);
    }
  }, [result, tournament]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAthlete) {
      return;
    }

    onSave({
      tournament_id: tournament.id,
      athlete_id: selectedAthlete.id,
      placement,
      points: finalPoints,
      is_manual: true,
    });
  };

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setAthleteSearch(`${athlete.last_name}, ${athlete.first_name}`);
    setShowAthleteDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? 'Ergebnis bearbeiten' : 'Ergebnis hinzufügen'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tournament Info */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-slate-700">{tournament.name}</div>
            <div className="text-xs text-slate-500">
              {new Date(tournament.date).toLocaleDateString('de-DE')}
            </div>
          </div>

          {/* Athlete Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Athlet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={athleteSearch}
                onChange={(e) => {
                  setAthleteSearch(e.target.value);
                  setShowAthleteDropdown(true);
                  if (selectedAthlete && 
                      `${selectedAthlete.last_name}, ${selectedAthlete.first_name}` !== e.target.value) {
                    setSelectedAthlete(null);
                  }
                }}
                onFocus={() => setShowAthleteDropdown(true)}
                placeholder="Athlet suchen..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500"
                required
              />
            </div>
            
            {showAthleteDropdown && filteredAthletes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredAthletes.map(athlete => (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => handleAthleteSelect(athlete)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {athlete.last_name}, {athlete.first_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {athlete.club || 'Kein Verein'} • Jg. {athlete.birth_year}
                      </div>
                    </div>
                    {selectedAthlete?.id === athlete.id && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {selectedAthlete && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <span className="font-medium">Ausgewählt:</span> {selectedAthlete.last_name}, {selectedAthlete.first_name}
                </div>
              </div>
            )}
          </div>

          {/* Placement Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Platzierung <span className="text-red-500">*</span>
            </label>
            <select
              value={placement}
              onChange={(e) => setPlacement(parseInt(e.target.value) as Placement)}
              className="w-full input-modern"
              required
            >
              {VALID_PLACEMENTS.map(p => (
                <option key={p} value={p}>
                  {getPlacementLabel(p)}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Judo-Standard: 1., 2., 3., 5., 7. Platz (keine 4. oder 6. Plätze)
            </p>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Punkte
            </label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="manualPoints"
                  checked={useManualPoints}
                  onChange={(e) => setUseManualPoints(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="manualPoints" className="text-sm text-slate-600">
                  Manuelle Punktevergabe
                </label>
              </div>
              
              {useManualPoints ? (
                <input
                  type="number"
                  value={manualPoints}
                  onChange={(e) => setManualPoints(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full input-modern"
                  placeholder="Punkte eingeben"
                  min="0"
                />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-lg font-semibold text-green-700">{autoPoints}</span>
                    <span className="text-sm text-green-600 ml-1">Punkte</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Basierend auf Turnier-Level
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!selectedAthlete}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}