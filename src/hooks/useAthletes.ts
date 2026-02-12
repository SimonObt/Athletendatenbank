'use client';

import { useState, useEffect, useCallback } from 'react';
import { Athlete } from '@/types';
import { generateImportId } from '@/lib/utils';
import { 
  getAthletes, 
  addAthlete as addAthleteApi, 
  updateAthlete as updateAthleteApi, 
  deleteAthlete as deleteAthleteApi,
  getAthleteByImportId as getAthleteByImportIdApi 
} from '@/lib/supabase';

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load athletes on mount
  useEffect(() => {
    const loadAthletes = async () => {
      const data = await getAthletes();
      setAthletes(data);
      setIsLoading(false);
    };
    loadAthletes();
  }, []);

  const addAthlete = useCallback(async (athleteData: Omit<Athlete, 'id' | 'import_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const importId = generateImportId(athleteData.last_name, athleteData.first_name, athleteData.birth_year);
    
    const result = await addAthleteApi({
      ...athleteData,
      import_id: importId,
    });

    if (result.success) {
      // Refresh athletes list
      const updated = await getAthletes();
      setAthletes(updated);
    }

    return result;
  }, []);

  const updateAthlete = useCallback(async (id: string, updates: Partial<Athlete>): Promise<{ success: boolean; error?: string }> => {
    const result = await updateAthleteApi(id, updates);

    if (result.success) {
      const updated = await getAthletes();
      setAthletes(updated);
    }

    return result;
  }, []);

  const deleteAthlete = useCallback(async (id: string) => {
    await deleteAthleteApi(id);
    const updated = await getAthletes();
    setAthletes(updated);
  }, []);

  const getAthleteByImportId = useCallback(async (importId: string): Promise<Athlete | null> => {
    return await getAthleteByImportIdApi(importId);
  }, []);

  const importAthletes = useCallback(async (newAthletes: Partial<Athlete>[], conflicts: Map<number, 'skip' | 'update' | 'create'>): Promise<{ 
    imported: number; 
    updated: number; 
    skipped: number;
    errors: string[];
  }> => {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < newAthletes.length; i++) {
      const data = newAthletes[i];
      const action = conflicts.get(i) || 'create';
      
      if (action === 'skip') {
        skipped++;
        continue;
      }

      try {
        if (!data.first_name || !data.last_name || !data.birth_year) {
          errors.push(`Zeile ${i + 1}: Fehlende Pflichtfelder`);
          continue;
        }

        const importId = generateImportId(data.last_name, data.first_name, data.birth_year);
        const existing = await getAthleteByImportIdApi(importId);

        if (existing && action === 'update') {
          // Update existing
          await updateAthleteApi(existing.id, {
            ...data,
            import_id: importId,
          });
          updated++;
        } else if (!existing && action === 'create') {
          // Create new
          await addAthleteApi({
            import_id: importId,
            first_name: data.first_name,
            last_name: data.last_name,
            gender: data.gender || 'männlich',
            birth_year: data.birth_year,
            district: data.district,
            club: data.club,
            phone: data.phone,
            email: data.email,
          });
          imported++;
        }
      } catch (error) {
        errors.push(`Zeile ${i + 1}: ${error}`);
      }
    }

    // Refresh list
    const refreshed = await getAthletes();
    setAthletes(refreshed);

    return { imported, updated, skipped, errors };
  }, []);

  return {
    athletes,
    isLoading,
    addAthlete,
    updateAthlete,
    deleteAthlete,
    getAthleteByImportId,
    importAthletes,
  };
}
