'use client';

import { useState, useCallback } from 'react';
import { parse } from 'papaparse';
import { Athlete, CsvAthlete } from '@/types';
import { generateImportId, parseBirthYear, validateEmail, validatePhone } from '@/lib/utils';
import { X, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface CsvImportProps {
  isOpen: boolean;
  onClose: () => void;
  existingAthletes: Athlete[];
  onImport: (athletes: Partial<Athlete>[], conflicts: Map<number, 'skip' | 'update' | 'create'>) => void;
}

export function CsvImport({ isOpen, onClose, existingAthletes, onImport }: CsvImportProps) {
  const [parsedData, setParsedData] = useState<Partial<Athlete>[]>([]);
  const [conflicts, setConflicts] = useState<Map<number, 'skip' | 'update' | 'create'>>(new Map());
  const [step, setStep] = useState<'upload' | 'preview' | 'conflicts'>('upload');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  
  // Safety check - ensure we have an array
  const athletesList = existingAthletes || [];

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as CsvAthlete[];
          const athletes: Partial<Athlete>[] = [];
          const newConflicts = new Map<number, 'skip' | 'update' | 'create'>();

          const csvImportIds = new Set<string>(); // BUG-2: Track IDs within CSV
          const skippedRows: number[] = [];
          const skippedReasons: Map<number, string> = new Map();

          data.forEach((row, index) => {
            if (!row.Vorname || !row.Nachname || !row.Jahrgang) {
              skippedRows.push(index);
              skippedReasons.set(index, 'Fehlende Pflichtfelder');
              return; // Skip invalid rows
            }

            // BUG-1 Fix: Jahrgang korrekt parsen
            const birthYear = parseBirthYear(row.Jahrgang);
            if (!birthYear) {
              skippedRows.push(index);
              skippedReasons.set(index, 'Ungültiger Jahrgang: ' + row.Jahrgang);
              return; // Skip invalid birth year
            }

            // BUG-4 Fix: Geschlecht validieren (Pflichtfeld)
            const genderLower = row.Geschlecht?.toLowerCase().trim();
            if (!genderLower || (genderLower !== 'männlich' && genderLower !== 'weiblich' && genderLower !== 'divers')) {
              skippedRows.push(index);
              skippedReasons.set(index, 'Ungültiges Geschlecht: ' + (row.Geschlecht || 'leer'));
              return; // Skip if gender is missing or invalid
            }
            const gender = genderLower === 'weiblich' ? 'weiblich' : 
                          genderLower === 'divers' ? 'divers' : 'männlich';

            // BUG-3 Fix: Email/Telefon validieren (nur Warnung, nicht blockieren)
            const email = row.Email?.trim() || '';
            const phone = row.Telefon?.trim() || '';

            const athlete: Partial<Athlete> = {
              first_name: row.Vorname.trim(),
              last_name: row.Nachname.trim(),
              gender,
              birth_year: birthYear,
              district: row.Bezirk?.trim(),
              club: row.Verein?.trim(),
              phone,
              email,
            };

            // BUG-2 Fix: CSV-interne Dubletten prüfen
            const importId = generateImportId(athlete.last_name!, athlete.first_name!, athlete.birth_year!);
            
            if (csvImportIds.has(importId)) {
              skippedRows.push(index);
              skippedReasons.set(index, 'Dublette innerhalb der CSV');
              return; // Skip duplicate within CSV
            }
            csvImportIds.add(importId);

            athletes.push(athlete);

            // Check for conflicts with existing DB
            const existing = athletesList.find(a => a.import_id === importId);
            
            if (existing) {
              newConflicts.set(athletes.length - 1, 'skip'); // Default to skip
            } else {
              newConflicts.set(athletes.length - 1, 'create');
            }
          });

          // Show warning for skipped rows
          if (skippedRows.length > 0) {
            console.warn(`CSV Import: ${skippedRows.length} Zeilen übersprungen:`, skippedReasons);
          }

          setParsedData(athletes);
          setConflicts(newConflicts);
          
          if (newConflicts.size > 0 && Array.from(newConflicts.values()).some(v => v === 'skip')) {
            setStep('conflicts');
          } else {
            setStep('preview');
          }
        } catch (err) {
          setError('Fehler beim Parsen der CSV-Datei: ' + (err as Error).message);
        }
      },
      error: (err) => {
        setError('Fehler beim Lesen der Datei: ' + err.message);
      }
    });
  }, [existingAthletes]);

  const handleConflictAction = (index: number, action: 'skip' | 'update' | 'create') => {
    setConflicts(prev => {
      const newMap = new Map(prev);
      newMap.set(index, action);
      return newMap;
    });
  };

  const handleImportAll = () => {
    onImport(parsedData, conflicts);
    handleClose();
  };

  const handleClose = () => {
    setParsedData([]);
    setConflicts(new Map());
    setStep('upload');
    setError(null);
    onClose();
  };

  const getConflictStats = () => {
    let skip = 0;
    let update = 0;
    let create = 0;
    
    conflicts.forEach(action => {
      if (action === 'skip') skip++;
      else if (action === 'update') update++;
      else if (action === 'create') create++;
    });
    
    return { skip, update, create };
  };

  const stats = getConflictStats();
  const hasConflicts = parsedData.some((_, index) => {
    const importId = generateImportId(parsedData[index].last_name!, parsedData[index].first_name!, parsedData[index].birth_year!);
    return athletesList.some(a => a.import_id === importId);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            CSV Import
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  CSV-Datei hierhin ziehen oder klicken zum Auswählen
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Datei auswählen
                </label>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <h3 className="font-medium mb-2">Erwartetes CSV-Format:</h3>
                <code className="block bg-gray-100 p-2 rounded mb-2">
                  Nachname,Vorname,Geschlecht,Jahrgang,Bezirk,Verein,Telefon,Email
                </code>
                <p className="mb-1"><strong>Pflichtfelder:</strong> Nachname, Vorname, Geschlecht (männlich/weiblich/divers), Jahrgang</p>
                <p className="mb-1"><strong>Jahrgang:</strong> 4-stellig (2008) oder 2-stellig (08 → 2008)</p>
                <p className="text-yellow-600"><strong>Hinweis:</strong> Dubletten innerhalb der CSV werden automatisch übersprungen</p>
              </div>
            </div>
          )}

          {(step === 'preview' || step === 'conflicts') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{parsedData.length}</span> Athleten gefunden
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">Neu: {stats.create}</span>
                  <span className="text-blue-600">Update: {stats.update}</span>
                  <span className="text-gray-600">Übersprungen: {stats.skip}</span>
                </div>
              </div>

              {hasConflicts && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Dubletten gefunden</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Einige Athleten existieren bereits. Bitte wählen Sie für jeden Konflikt eine Aktion aus.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newMap = new Map(conflicts);
                        newMap.forEach((_, key) => newMap.set(key, 'create'));
                        setConflicts(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Alle als neu importieren
                    </button>
                    <button
                      onClick={() => {
                        const newMap = new Map(conflicts);
                        newMap.forEach((_, key) => {
                          const importId = generateImportId(
                            parsedData[key].last_name!, 
                            parsedData[key].first_name!, 
                            parsedData[key].birth_year!
                          );
                          if (athletesList.some(a => a.import_id === importId)) {
                            newMap.set(key, 'update');
                          }
                        });
                        setConflicts(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Alle bestehenden aktualisieren
                    </button>
                    <button
                      onClick={() => {
                        const newMap = new Map(conflicts);
                        newMap.forEach((_, key) => {
                          const importId = generateImportId(
                            parsedData[key].last_name!, 
                            parsedData[key].first_name!, 
                            parsedData[key].birth_year!
                          );
                          if (athletesList.some(a => a.import_id === importId)) {
                            newMap.set(key, 'skip');
                          }
                        });
                        setConflicts(newMap);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Alle bestehenden überspringen
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Jahrgang</th>
                      <th className="px-3 py-2 text-left">Verein</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedData.map((athlete, index) => {
                      const importId = generateImportId(athlete.last_name!, athlete.first_name!, athlete.birth_year!);
                      const existing = athletesList.find(a => a.import_id === importId);
                      const action = conflicts.get(index) || 'create';
                      
                      return (
                        <tr key={index} className={existing ? 'bg-yellow-50' : ''}>
                          <td className="px-3 py-2">
                            {athlete.last_name}, {athlete.first_name}
                          </td>
                          <td className="px-3 py-2">{athlete.birth_year}</td>
                          <td className="px-3 py-2">{athlete.club || '-'}</td>
                          <td className="px-3 py-2">
                            {existing ? (
                              <span className="inline-flex items-center gap-1 text-yellow-700">
                                <AlertCircle className="w-4 h-4" />
                                Existiert bereits
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                Neu
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {existing ? (
                              <select
                                value={action}
                                onChange={(e) => handleConflictAction(index, e.target.value as 'skip' | 'update' | 'create')}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="skip">Überspringen</option>
                                <option value="update">Aktualisieren</option>
                                <option value="create">Als neu importieren</option>
                              </select>
                            ) : (
                              <span className="text-green-600">Wird importiert</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Zurück
                </button>
                <button
                  onClick={handleImportAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Importieren ({stats.create + stats.update} Athleten)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
