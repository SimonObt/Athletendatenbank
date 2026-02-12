'use client';

import { CampParticipantWithDetails, ParticipantStatus, PARTICIPANT_STATUS_FLOW } from '@/types';
import { ChevronDown, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ParticipantListProps {
  participants: CampParticipantWithDetails[];
  onStatusChange: (participantId: string, newStatus: ParticipantStatus) => void;
  onRemove: (participantId: string) => void;
  isFull: boolean;
  capacity?: number;
  confirmedCount: number;
}

const statusConfig: Record<ParticipantStatus, { label: string; color: string; bgColor: string }> = {
  'vorgeschlagen': { 
    label: 'Vorgeschlagen', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-50 border-yellow-200' 
  },
  'eingeladen': { 
    label: 'Eingeladen', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50 border-blue-200' 
  },
  'zugesagt': { 
    label: 'Zugesagt', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50 border-green-200' 
  },
  'abgesagt': { 
    label: 'Abgesagt', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50 border-red-200' 
  },
  'nachgerückt': { 
    label: 'Nachgerückt', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50 border-orange-200' 
  },
};

const statusOrder: ParticipantStatus[] = ['vorgeschlagen', 'eingeladen', 'zugesagt', 'nachgerückt', 'abgesagt'];

export function ParticipantList({ 
  participants, 
  onStatusChange, 
  onRemove, 
  isFull, 
  capacity, 
  confirmedCount 
}: ParticipantListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<ParticipantStatus, boolean>>({
    'vorgeschlagen': true,
    'eingeladen': true,
    'zugesagt': true,
    'abgesagt': true,
    'nachgerückt': true,
  });

  // Group participants by status
  const groupedParticipants = participants.reduce((acc, participant) => {
    const status = participant.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(participant);
    return acc;
  }, {} as Record<ParticipantStatus, CampParticipantWithDetails[]>);

  const toggleGroup = (status: ParticipantStatus) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const getAvailableStatuses = (currentStatus: ParticipantStatus): ParticipantStatus[] => {
    return PARTICIPANT_STATUS_FLOW[currentStatus] || [];
  };

  const canChangeToStatus = (participant: CampParticipantWithDetails, newStatus: ParticipantStatus): boolean => {
    // If changing to 'zugesagt' and camp is full, only allow if already confirmed or from 'nachgerückt'
    if (newStatus === 'zugesagt' && isFull && participant.status !== 'zugesagt' && participant.status !== 'nachgerückt') {
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {statusOrder.map((status) => {
        const groupParticipants = groupedParticipants[status] || [];
        if (groupParticipants.length === 0) return null;

        const config = statusConfig[status];
        const isExpanded = expandedGroups[status];

        return (
          <div key={status} className={`rounded-lg border ${config.bgColor} overflow-hidden`}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(status)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className={`font-semibold ${config.color}`}>
                  {config.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/80">
                  {groupParticipants.length}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            </button>

            {/* Group Content */}
            {isExpanded && (
              <div className="border-t border-inherit">
                {groupParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 border-b border-inherit last:border-b-0 hover:bg-white/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                            {participant.athlete?.first_name?.[0]}{participant.athlete?.last_name?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {participant.athlete?.first_name} {participant.athlete?.last_name}
                            </div>
                            {participant.athlete?.club && (
                              <div className="text-sm text-gray-500">
                                {participant.athlete.club}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {participant.comment && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            &quot;{participant.comment}&quot;
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Change Dropdown */}
                        <div className="relative group">
                          <select
                            value={participant.status}
                            onChange={(e) => onStatusChange(participant.id, e.target.value as ParticipantStatus)}
                            className="appearance-none px-3 py-1.5 pr-8 text-sm border rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            style={{ borderColor: 'inherit' }}
                          >
                            <option value={participant.status}>
                              {statusConfig[participant.status].label}
                            </option>
                            {getAvailableStatuses(participant.status).map((s) => (
                              <option 
                                key={s} 
                                value={s}
                                disabled={!canChangeToStatus(participant, s)}
                              >
                                → {statusConfig[s].label}
                                {s === 'zugesagt' && isFull && participant.status !== 'zugesagt' && participant.status !== 'nachgerückt' ? ' (Camp voll)' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(participant.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Entfernen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State - No participants at all */}
      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Keine Teilnehmer vorhanden.
        </div>
      )}
    </div>
  );
}