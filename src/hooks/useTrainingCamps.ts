'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrainingCamp, TrainingCampWithDetails, CampParticipant, CampParticipantWithDetails, CampFilters, ParticipantStatus } from '@/types';
import { 
  getTrainingCamps, 
  getTrainingCampById,
  addTrainingCamp, 
  updateTrainingCamp, 
  deleteTrainingCamp,
  duplicateTrainingCamp,
  getCampParticipants,
  addCampParticipant,
  updateCampParticipant,
  removeCampParticipant,
  checkCampParticipant,
} from '@/lib/supabase';

export function useTrainingCamps() {
  const [camps, setCamps] = useState<TrainingCamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load camps on mount
  useEffect(() => {
    const loadCamps = async () => {
      const data = await getTrainingCamps();
      setCamps(data);
      setIsLoading(false);
    };
    loadCamps();
  }, []);

  const getCamps = useCallback(async (filters?: CampFilters): Promise<TrainingCamp[]> => {
    return await getTrainingCamps(filters);
  }, []);

  const getCampById = useCallback(async (id: string): Promise<TrainingCampWithDetails | null> => {
    return await getTrainingCampById(id);
  }, []);

  const addCamp = useCallback(async (campData: Omit<TrainingCamp, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: TrainingCamp; error?: string }> => {
    const result = await addTrainingCamp(campData);

    if (result.success) {
      // Refresh camps list
      const updated = await getTrainingCamps();
      setCamps(updated);
    }

    return result;
  }, []);

  const updateCamp = useCallback(async (id: string, updates: Partial<TrainingCamp>): Promise<{ success: boolean; error?: string }> => {
    const result = await updateTrainingCamp(id, updates);

    if (result.success) {
      const updated = await getTrainingCamps();
      setCamps(updated);
    }

    return result;
  }, []);

  const deleteCamp = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteTrainingCamp(id);

    if (result.success) {
      const updated = await getTrainingCamps();
      setCamps(updated);
    }

    return result;
  }, []);

  const duplicateCamp = useCallback(async (id: string, newDates?: { start_date: string; end_date: string }): Promise<{ success: boolean; data?: TrainingCamp; error?: string }> => {
    const result = await duplicateTrainingCamp(id, newDates);

    if (result.success) {
      const updated = await getTrainingCamps();
      setCamps(updated);
    }

    return result;
  }, []);

  const nominateAthlete = useCallback(async (campId: string, athleteId: string, initialStatus: ParticipantStatus = 'vorgeschlagen'): Promise<{ success: boolean; data?: CampParticipant; error?: string }> => {
    // Check if already in camp
    const existing = await checkCampParticipant(campId, athleteId);
    if (existing) {
      return { success: false, error: 'Athlet ist bereits im Camp' };
    }

    const result = await addCampParticipant({
      camp_id: campId,
      athlete_id: athleteId,
      status: initialStatus,
    });

    return result;
  }, []);

  const updateParticipantStatus = useCallback(async (participantId: string, status: ParticipantStatus, comment?: string): Promise<{ success: boolean; error?: string }> => {
    const updates: Partial<CampParticipant> = { status };
    if (comment !== undefined) {
      updates.comment = comment;
    }
    
    return await updateCampParticipant(participantId, updates);
  }, []);

  const removeParticipant = useCallback(async (participantId: string): Promise<{ success: boolean; error?: string }> => {
    return await removeCampParticipant(participantId);
  }, []);

  const exportEmailList = useCallback(async (campId: string, statusFilter?: ParticipantStatus[]): Promise<string> => {
    const participants = await getCampParticipants(campId);
    
    // Filter by status if specified
    let filteredParticipants = participants;
    if (statusFilter && statusFilter.length > 0) {
      filteredParticipants = participants.filter(p => statusFilter.includes(p.status));
    }
    
    // Extract emails (skip participants without email or deleted athletes)
    const emails = filteredParticipants
      .filter(p => p.athlete?.email)
      .map(p => p.athlete!.email!);
    
    // Return comma-separated list
    return emails.join(', ');
  }, []);

  const getCampStats = useCallback(async (campId: string) => {
    const participants = await getCampParticipants(campId);
    
    return {
      total: participants.length,
      vorgeschlagen: participants.filter(p => p.status === 'vorgeschlagen').length,
      eingeladen: participants.filter(p => p.status === 'eingeladen').length,
      zugesagt: participants.filter(p => p.status === 'zugesagt').length,
      abgesagt: participants.filter(p => p.status === 'abgesagt').length,
      nachgerueckt: participants.filter(p => p.status === 'nachgerückt').length,
    };
  }, []);

  return {
    camps,
    isLoading,
    getCamps,
    getCampById,
    addCamp,
    updateCamp,
    deleteCamp,
    duplicateCamp,
    nominateAthlete,
    updateParticipantStatus,
    removeParticipant,
    exportEmailList,
    getCampStats,
  };
}