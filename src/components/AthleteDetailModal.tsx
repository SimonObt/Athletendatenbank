'use client';

import { useState, useEffect } from 'react';
import { Athlete, AthleteStats } from '@/types';
import { X, Trophy, Calendar, TrendingUp, Award, Medal } from 'lucide-react';
import { useResults } from '@/hooks/useResults';

interface AthleteDetailModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AthleteDetailModal({ athlete, isOpen, onClose }: AthleteDetailModalProps) {
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const { getAthleteResultsDetailed } = useResults();

  useEffect(() => {
    if (athlete && isOpen) {
      setIsLoading(true);
      getAthleteResultsDetailed(athlete.id).then(data => {
        setStats(data);
        setIsLoading(false);
      });
    }
  }, [athlete, isOpen, getAthleteResultsDetailed]);

  if (!isOpen || !athlete) return null;

  const years = stats ? Object.keys(stats.resultsByYear).map(Number).sort((a, b) => b - a) : [];
  
  const filteredResults = stats && selectedYear !== 'all' 
    ? stats.resultsByYear[selectedYear] || []
    : stats?.pointsProgression.flatMap((pp, idx) => {
        // Find the corresponding detailed result
        for (const year of years) {
          const yearResults = stats.resultsByYear[year];
          const match = yearResults.find(yr => yr.tournament.name === pp.tournamentName);
          if (match) return [match];
        }
        return [];
      }) || [];

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center font-medium text-gray-500">{placement}.</span>;
    }
  };

  // BUG-4 Fix: Simple line chart component with tooltip
  const PointsChart = ({ data }: { data: { date: string; cumulativePoints: number; tournamentName: string }[] }) => {
    if (data.length < 2) return null;
    
    const maxPoints = Math.max(...data.map(d => d.cumulativePoints), 1);
    const width = 100;
    const height = 40;
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.cumulativePoints / maxPoints) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Punkteentwicklung</h4>
        <div className="relative h-32">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full" 
            preserveAspectRatio="none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Grid lines */}
            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#e5e7eb" strokeWidth="0.2" />
            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#e5e7eb" strokeWidth="0.2" />
            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#e5e7eb" strokeWidth="0.2" />
            
            {/* Line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.8"
              points={points}
            />
            
            {/* Points with hover */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * width;
              const y = height - (d.cumulativePoints / maxPoints) * height;
              const isHovered = hoveredIndex === i;
              return (
                <g key={i}>
                  {/* Invisible hit area for easier hovering */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Visible point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "2.5" : "1.5"}
                    fill={isHovered ? "#1d4ed8" : "#3b82f6"}
                    style={{ transition: 'all 0.2s' }}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400">
            <span>{maxPoints}</span>
            <span>{Math.round(maxPoints / 2)}</span>
            <span>0</span>
          </div>
          
          {/* BUG-4 Fix: Tooltip */}
          {hoveredIndex !== null && (
            <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 shadow-lg">
              <div className="font-medium">{data[hoveredIndex].tournamentName}</div>
              <div className="text-gray-300">{new Date(data[hoveredIndex].date).toLocaleDateString('de-DE')}</div>
              <div className="text-blue-300">{data[hoveredIndex].cumulativePoints} Punkte</div>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Kumulierte Punkte über {data.length} Turniere
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {athlete.last_name}, {athlete.first_name}
            </h2>
            <p className="text-sm text-gray-500">
              {athlete.club || 'Kein Verein'} • Jahrgang {athlete.birth_year} • {athlete.gender}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Lade Details...</div>
          ) : !stats || stats.totalTournaments === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Noch keine Turnierergebnisse vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalTournaments}</div>
                  <div className="text-xs text-gray-600">Turniere</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalPoints}</div>
                  <div className="text-xs text-gray-600">Punkte</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.averagePlacement}</div>
                  <div className="text-xs text-gray-600">Ø Platzierung</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center">
                    {stats.bestPlacement ? getPlacementIcon(stats.bestPlacement) : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Beste Platz.</div>
                </div>
              </div>

              {/* Points Chart */}
              <PointsChart data={stats.pointsProgression} />

              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Jahr:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">Alle Jahre</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Results List */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Turnierergebnisse {selectedYear !== 'all' && `(${selectedYear})`}
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(selectedYear === 'all' 
                    ? Object.entries(stats.resultsByYear)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .flatMap(([, results]) => results)
                    : filteredResults
                  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((dr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getPlacementIcon(dr.result.placement)}
                        <div>
                          <div className="font-medium text-gray-900">{dr.tournament.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(dr.date).toLocaleDateString('de-DE')} • {new Date(dr.date).getFullYear()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{dr.result.points} Punkte</div>
                        <div className="text-xs text-gray-500">{dr.result.placement}. Platz</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
