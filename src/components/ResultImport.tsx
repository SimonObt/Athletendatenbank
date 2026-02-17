'use client';

import { useState, useCallback } from 'react';
import { parse } from 'papaparse';
import { Tournament, Athlete, ParsedResultRow, Placement, MatchStatus } from '@/types';
import { findBestMatch, isValidPlacement, calculatePoints, getPlacementLabel } from '@/hooks/useResults';
import { X, Upload, AlertCircle, CheckCircle, XCircle, UserPlus, Link2 } from 'lucide-react';

interface ResultImportProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  athletes: Athlete[];
  onImport: (rows: ParsedResultRow[], actions: Map<number, 'import' | 'skip' | 'create' | 'overwrite'>) => void;
  existingResults: Array<{ athlete_id: string; placement: Placement; result_id: string }>;
}

// Separate component for action select to avoid hook issues
interface ActionSelectProps {
  row: ParsedResultRow;
  action: string;
  existingResults: Array<{ athlete_id: string; placement: Placement; result_id: string }>;
  onChange: (action: 'import' | 'skip' | 'create' | 'overwrite') => void;
}

function ActionSelect({ row, action, existingResults, onChange }: ActionSelectProps) {
  const hasExistingResult = row.matchedAthlete && existingResults.some(r => r.athlete_id === row.matchedAthlete!.id);
  
  // Always render all options to keep React's virtual DOM consistent
  // Use disabled to control which are selectable
  return (
    <select
      value={action}
      onChange={(e) => onChange(e.target.value as 'import' | 'skip' | 'create' | 'overwrite')}
      className="text-sm border border-slate-300 rounded px-2 py-1"
    >
      <option value="skip">Überspringen</option>
      <option value="import" disabled={!row.matchedAthlete || hasExistingResult}>
        {hasExistingResult ? 'Bereits vorhanden - kann nicht importieren' : 'Importieren'}
      </option>
      <option value="overwrite" disabled={!hasExistingResult}>
        Überschreiben
      </option>
      <option value="create" disabled={!!row.matchedAthlete}>
        Neu anlegen
      </option>
    </select>
  );
}

// Separate component for similar athletes dropdown
interface SimilarAthletesSelectProps {
  row: ParsedResultRow;
  athletes: Athlete[];
  onSelect: (athlete: Athlete) => void;
}

function SimilarAthletesSelect({ row, athletes, onSelect }: SimilarAthletesSelectProps) {
  if (!row.similarAthletes || row.similarAthletes.length === 0 || row.matchedAthlete) {
    return null;
  }
  
  return (
    <div className="mt-1">
      <select
        onChange={(e) => {
          const athlete = athletes.find(a => a.id === e.target.value);
          if (athlete) onSelect(athlete);
        }}
        className="text-xs border border-slate-300 rounded px-2 py-1 w-full"
        defaultValue=""
      >
        <option value="" disabled>Ähnlichen Athleten wählen...</option>
        {row.similarAthletes.map(athlete => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.last_name}, {athlete.first_name} ({athlete.birth_year})
          </option>
        ))}
      </select>
    </div>
  );
}

// Separate component for table row to avoid hook issues
interface ResultRowProps {
  row: ParsedResultRow;
  action: string;
  tournament: Tournament;
  existingResults: Array<{ athlete_id: string; placement: Placement; result_id: string }>;
  athletes: Athlete[];
  onActionChange: (action: 'import' | 'skip' | 'create' | 'overwrite') => void;
  onMatchAthlete: (athlete: Athlete) => void;
}

function ResultRow({ row, action, tournament, existingResults, athletes, onActionChange, onMatchAthlete }: ResultRowProps) {
  const points = row.matchedAthlete && (action === 'import' || action === 'overwrite')
    ? calculatePoints(row.placement, tournament)
    : 0;
    
  const hasDuplicate = row.matchedAthlete && existingResults.some(r => r.athlete_id === row.matchedAthlete!.id);
  
  let statusIcon;
  let statusText;
  
  if (hasDuplicate) {
    statusIcon = <XCircle className="w-5 h-5 text-orange-500" />;
    statusText = 'Bereits vorhanden';
  } else if (row.matchStatus === 'exact') {
    statusIcon = <CheckCircle className="w-5 h-5 text-green-500" />;
    statusText = 'Gefunden';
  } else if (row.matchStatus === 'similar') {
    statusIcon = <AlertCircle className="w-5 h-5 text-yellow-500" />;
    statusText = `Ähnlich (${row.matchConfidence}%)`;
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-red-500" />;
    statusText = 'Unbekannt';
  }

  return (
    <tr className={!row.matchedAthlete ? 'bg-red-50' : ''}>
      <td className="px-3 py-2">
        {row.lastName}, {row.firstName}
        {row.matchedAthlete && (
          <div className="text-xs text-green-600">
            → {row.matchedAthlete.last_name}, {row.matchedAthlete.first_name}
          </div>
        )}
      </td>
      <td className="px-3 py-2">{row.birthYear || '-'}</td>
      <td className="px-3 py-2">{row.club || '-'}</td>
      <td className="px-3 py-2">{getPlacementLabel(row.placement)}</td>
      <td className="px-3 py-2">
        {(action === 'import' || action === 'overwrite') ? (
          <span className="font-medium text-green-600">{points}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="text-xs">{statusText}</span>
        </div>
      </td>
      <td className="px-3 py-2">
        <ActionSelect 
          row={row} 
          action={action}
          existingResults={existingResults}
          onChange={onActionChange}
        />
        <SimilarAthletesSelect
          row={row}
          athletes={athletes}
          onSelect={onMatchAthlete}
        />
      </td>
    </tr>
  );
}

export function ResultImport({ isOpen, onClose, tournament, athletes, onImport, existingResults }: ResultImportProps) {
  const [parsedRows, setParsedRows] = useState<ParsedResultRow[]>([]);
  const [actions, setActions] = useState<Map<number, 'import' | 'skip' | 'create' | 'overwrite'>>(new Map());
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [skippedRows, setSkippedRows] = useState<{index: number; reason: string}[]>([]);
  const [birthYearMismatches, setBirthYearMismatches] = useState<{row: ParsedResultRow; csvYear: number; athleteYear: number}[]>([]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSkippedRows([]);
    setBirthYearMismatches([]);
    
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];
          const rows: ParsedResultRow[] = [];
          const newActions = new Map<number, 'import' | 'skip' | 'create' | 'overwrite'>();
          const skipped: {index: number; reason: string}[] = [];
          const mismatches: {row: ParsedResultRow; csvYear: number; athleteYear: number}[] = [];

          data.forEach((row, index) => {
            // Parse placement
            const placementValue = parseInt(row.Platz || row.Platzierung || '0');
            if (!isValidPlacement(placementValue)) {
              // BUG-1 Fix: Track invalid placements
              skipped.push({index, reason: `Ungültige Platzierung: ${placementValue}. Gültig sind: 1, 2, 3, 5, 7`});
              return;
            }

            // Parse name
            let firstName = '';
            let lastName = '';
            
            if (row.Vorname && row.Nachname) {
              firstName = row.Vorname.trim();
              lastName = row.Nachname.trim();
            } else if (row.Name) {
              const parts = row.Name.trim().split(/\s+/);
              if (parts.length >= 2) {
                firstName = parts[0];
                lastName = parts.slice(1).join(' ');
              } else {
                lastName = parts[0] || '';
              }
            }

            if (!firstName && !lastName) {
              skipped.push({index, reason: 'Fehlender Name'});
              return;
            }

            // Parse birth year
            const birthYear = row.Jahrgang ? parseInt(row.Jahrgang) : undefined;

            // Find matching athlete
            const { athlete, confidence, similarAthletes } = findBestMatch(
              firstName,
              lastName,
              athletes,
              birthYear
            );

            let matchStatus: MatchStatus = 'unknown';
            if (athlete && confidence >= 95) {
              matchStatus = 'exact';
            } else if (athlete && confidence >= 80) {
              matchStatus = 'similar';
            }

            // Check for duplicate result
            const hasDuplicate = athlete && existingResults.some(r => r.athlete_id === athlete.id);

            // BUG-2 Fix: Check for birth year mismatch
            if (athlete && birthYear && athlete.birth_year !== birthYear) {
              mismatches.push({
                row: {
                  rowIndex: index,
                  firstName,
                  lastName,
                  birthYear,
                  club: row.Verein?.trim(),
                  gender: row.Geschlecht?.trim(),
                  placement: placementValue as Placement,
                  matchedAthlete: athlete,
                  matchStatus,
                  matchConfidence: confidence,
                  similarAthletes: similarAthletes.slice(0, 3),
                },
                csvYear: birthYear,
                athleteYear: athlete.birth_year
              });
            }

            rows.push({
              rowIndex: index,
              firstName,
              lastName,
              birthYear,
              club: row.Verein?.trim(),
              gender: row.Geschlecht?.trim(),
              placement: placementValue as Placement,
              matchedAthlete: athlete || undefined,
              matchStatus,
              matchConfidence: confidence,
              similarAthletes: similarAthletes.slice(0, 3),
            });

            // Default action based on match status
            if (hasDuplicate) {
              newActions.set(index, 'skip'); // BUG-3: Default to skip, but overwrite is now possible
            } else if (matchStatus === 'exact' || matchStatus === 'similar') {
              newActions.set(index, 'import');
            } else {
              newActions.set(index, 'skip');
            }
          });

          setParsedRows(rows);
          setActions(newActions);
          setSkippedRows(skipped);
          setBirthYearMismatches(mismatches);
          setStep('preview');
        } catch (err) {
          setError('Fehler beim Parsen der CSV-Datei: ' + (err as Error).message);
        }
      },
      error: (err) => {
        setError('Fehler beim Lesen der Datei: ' + err.message);
      }
    });
  }, [athletes, existingResults]);

  const handleActionChange = (rowIndex: number, action: 'import' | 'skip' | 'create' | 'overwrite') => {
    setActions(prev => {
      const newMap = new Map(prev);
      newMap.set(rowIndex, action);
      return newMap;
    });
  };

  const handleMatchAthlete = (rowIndex: number, athlete: Athlete) => {
    setParsedRows(prev => prev.map(row => {
      if (row.rowIndex === rowIndex) {
        return {
          ...row,
          matchedAthlete: athlete,
          matchStatus: 'exact' as MatchStatus,
          matchConfidence: 100,
        };
      }
      return row;
    }));
    setActions(prev => {
      const newMap = new Map(prev);
      newMap.set(rowIndex, 'import');
      return newMap;
    });
  };

  const handleImportAll = () => {
    onImport(parsedRows, actions);
    handleClose();
  };

  const handleClose = () => {
    setParsedRows([]);
    setActions(new Map());
    setStep('upload');
    setError(null);
    setSkippedRows([]);
    setBirthYearMismatches([]);
    onClose();
  };

  const getStats = () => {
    let import_ = 0;
    let skip = 0;
    let overwrite = 0;
    let unknown = 0;
    
    parsedRows.forEach(row => {
      const action = actions.get(row.rowIndex) || 'skip';
      if (action === 'import') import_++;
      else if (action === 'skip') skip++;
      else if (action === 'overwrite') overwrite++;
      
      if (!row.matchedAthlete && action !== 'create') {
        unknown++;
      }
    });
    
    return { import: import_, skip, overwrite, unknown };
  };

  const stats = getStats();
  const hasUnknown = parsedRows.some(row => !row.matchedAthlete && actions.get(row.rowIndex) !== 'create');
  const hasDuplicates = parsedRows.some(row => {
    if (!row.matchedAthlete) return false;
    return existingResults.some(r => r.athlete_id === row.matchedAthlete!.id);
  });

  // Early return after all hooks to maintain hook order consistency
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Turnierergebnisse importieren
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {tournament.name} • {new Date(tournament.date).toLocaleDateString('de-DE')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  CSV-Datei mit Turnierergebnissen hierhin ziehen oder klicken zum Auswählen
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-results-upload"
                />
                <label
                  htmlFor="csv-results-upload"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  Datei auswählen
                </label>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                <h3 className="font-medium mb-2">Erwartetes CSV-Format:</h3>
                <code className="block bg-slate-100 p-2 rounded mb-2">
                  Nachname,Vorname,Jahrgang,Platz,Verein
                </code>
                <p className="mb-2">Alternative Spaltennamen: Name (statt Vorname/Nachname), Platzierung (statt Platz)</p>
                <p className="text-xs text-slate-500">
                  Gültige Platzierungen: 1, 2, 3, 5, 7 (Judo-Standard)
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{parsedRows.length}</span> Ergebnisse gefunden
                </div>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-green-600">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Import: {stats.import}
                  </span>
                  {stats.overwrite > 0 && (
                    <span className="text-orange-600">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Überschreiben: {stats.overwrite}
                    </span>
                  )}
                  <span className="text-slate-600">
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Übersprungen: {stats.skip}
                  </span>
                </div>
              </div>

              {skippedRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{skippedRows.length} Zeilen übersprungen</span>
                  </div>
                  <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                    {skippedRows.map((skipped, idx) => (
                      <div key={idx} className="mb-1">
                        Zeile {skipped.index + 1}: {skipped.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {birthYearMismatches.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Abweichende Jahrgänge gefunden</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">
                    Bei folgenden Athleten unterscheidet sich der Jahrgang in der CSV vom System:
                  </p>
                  <div className="text-sm text-yellow-700 max-h-32 overflow-y-auto">
                    {birthYearMismatches.map((mismatch, idx) => (
                      <div key={idx} className="mb-1">
                        {mismatch.row.lastName}, {mismatch.row.firstName}: 
                        CSV sagt {mismatch.csvYear}, System hat {mismatch.athleteYear}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasDuplicates && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Doppelte Einträge gefunden</span>
                  </div>
                  <p className="text-sm text-orange-700 mb-2">
                    Einige Athleten haben bereits ein Ergebnis für dieses Turnier. 
                    Sie können überspringen oder das bestehende Ergebnis überschreiben.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newMap = new Map(actions);
                        parsedRows.forEach(row => {
                          if (row.matchedAthlete && existingResults.some(r => r.athlete_id === row.matchedAthlete!.id)) {
                            newMap.set(row.rowIndex, 'skip');
                          }
                        });
                        setActions(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                    >
                      Alle Duplikate überspringen
                    </button>
                    <button
                      onClick={() => {
                        const newMap = new Map(actions);
                        parsedRows.forEach(row => {
                          if (row.matchedAthlete && existingResults.some(r => r.athlete_id === row.matchedAthlete!.id)) {
                            newMap.set(row.rowIndex, 'overwrite');
                          }
                        });
                        setActions(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Alle Duplikate überschreiben
                    </button>
                  </div>
                </div>
              )}

              {hasUnknown && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Unbekannte Athleten</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Einige Athleten wurden nicht gefunden. Bitte weisen Sie diese manuell zu oder überspringen Sie sie.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newMap = new Map(actions);
                        parsedRows.forEach(row => {
                          if (!row.matchedAthlete) {
                            newMap.set(row.rowIndex, 'skip');
                          }
                        });
                        setActions(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                    >
                      Alle Unbekannten überspringen
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Jahrgang</th>
                      <th className="px-3 py-2 text-left">Verein</th>
                      <th className="px-3 py-2 text-left">Platzierung</th>
                      <th className="px-3 py-2 text-left">Punkte</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedRows.map((row) => (
                      <ResultRow
                        key={row.rowIndex}
                        row={row}
                        action={actions.get(row.rowIndex) || 'skip'}
                        tournament={tournament}
                        existingResults={existingResults}
                        athletes={athletes}
                        onActionChange={(newAction) => handleActionChange(row.rowIndex, newAction)}
                        onMatchAthlete={(athlete) => handleMatchAthlete(row.rowIndex, athlete)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Zurück
                </button>
                <button
                  onClick={handleImportAll}
                  disabled={stats.import === 0 && stats.overwrite === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Importieren ({stats.import + stats.overwrite} Ergebnisse)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}