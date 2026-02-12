'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tournament, TournamentLevel } from '@/types';
import { 
  getTournaments, 
  getTournamentLevels,
  addTournament as addTournamentApi, 
  updateTournament as updateTournamentApi, 
  deleteTournament as deleteTournamentApi,
  addTournamentLevel as addTournamentLevelApi,
  updateTournamentLevel as updateTournamentLevelApi,
  deleteTournamentLevel as deleteTournamentLevelApi,
  completeTournament as completeTournamentApi
} from '@/lib/supabase';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentLevels, setTournamentLevels] = useState<TournamentLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tournaments and levels on mount
  useEffect(() => {
    const loadData = async () => {
      const [tournamentsData, levelsData] = await Promise.all([
        getTournaments(),
        getTournamentLevels()
      ]);
      setTournaments(tournamentsData);
      setTournamentLevels(levelsData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Tournament Operations
  const addTournament = useCallback(async (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const result = await addTournamentApi(tournamentData);

    if (result.success) {
      const updated = await getTournaments();
      setTournaments(updated);
    }

    return result;
  }, []);

  const updateTournament = useCallback(async (id: string, updates: Partial<Tournament>): Promise<{ success: boolean; error?: string }> => {
    const result = await updateTournamentApi(id, updates);

    if (result.success) {
      const updated = await getTournaments();
      setTournaments(updated);
    }

    return result;
  }, []);

  const deleteTournament = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteTournamentApi(id);
    
    if (result.success) {
      const updated = await getTournaments();
      setTournaments(updated);
    }

    return result;
  }, []);

  const completeTournament = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await completeTournamentApi(id);

    if (result.success) {
      const updated = await getTournaments();
      setTournaments(updated);
    }

    return result;
  }, []);

  // Tournament Level Operations
  const addTournamentLevel = useCallback(async (levelData: Omit<TournamentLevel, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> => {
    const result = await addTournamentLevelApi(levelData);

    if (result.success) {
      const updated = await getTournamentLevels();
      setTournamentLevels(updated);
    }

    return result;
  }, []);

  const updateTournamentLevel = useCallback(async (id: string, updates: Partial<TournamentLevel>): Promise<{ success: boolean; error?: string }> => {
    const result = await updateTournamentLevelApi(id, updates);

    if (result.success) {
      const updated = await getTournamentLevels();
      setTournamentLevels(updated);
    }

    return result;
  }, []);

  const deleteTournamentLevel = useCallback(async (id: string): Promise<{ success: boolean; error?: string; tournamentsCount?: number }> => {
    const result = await deleteTournamentLevelApi(id);

    if (result.success) {
      const updated = await getTournamentLevels();
      setTournamentLevels(updated);
    }

    return result;
  }, []);

  // Get level by ID
  const getLevelById = useCallback((id: string): TournamentLevel | undefined => {
    return tournamentLevels.find(l => l.id === id);
  }, [tournamentLevels]);

  // Get tournaments using a specific level
  const getTournamentsByLevel = useCallback((levelId: string): Tournament[] => {
    return tournaments.filter(t => t.level_id === levelId);
  }, [tournaments]);

  return {
    tournaments,
    tournamentLevels,
    isLoading,
    addTournament,
    updateTournament,
    deleteTournament,
    completeTournament,
    addTournamentLevel,
    updateTournamentLevel,
    deleteTournamentLevel,
    getLevelById,
    getTournamentsByLevel,
  };
}
