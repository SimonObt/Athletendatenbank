'use client';

import { useState, useEffect, useMemo } from 'react';
import { Athlete, Tournament, TournamentResultWithDetails, RankingEntry, RankingFilters, ParsedResultRow, TrainingCamp } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAthletes } from '@/hooks/useAthletes';
import { useTournaments } from '@/hooks/useTournaments';
import { useResults } from '@/hooks/useResults';
import { useTrainingCamps } from '@/hooks/useTrainingCamps';
import { AthleteList } from '@/components/AthleteList';
import { AthleteForm } from '@/components/AthleteForm';
import { CsvImport } from '@/components/CsvImport';
import { DeleteConfirm } from '@/components/DeleteConfirm';
import { TournamentList } from '@/components/TournamentList';
import { TournamentForm } from '@/components/TournamentForm';
import { TournamentLevelManager } from '@/components/TournamentLevelManager';
import { TournamentDeleteConfirm } from '@/components/TournamentDeleteConfirm';
import { ResultList } from '@/components/ResultList';
import { ResultForm } from '@/components/ResultForm';
import { ResultImport } from '@/components/ResultImport';
import { ResultDeleteConfirm } from '@/components/ResultDeleteConfirm';
import { RankingList } from '@/components/RankingList';
import { AthleteDetailModal } from '@/components/AthleteDetailModal';
import { CampList } from '@/components/CampList';
import { CampForm } from '@/components/CampForm';
import { CampDetail } from '@/components/CampDetail';
import { CampDeleteConfirm } from '@/components/CampDeleteConfirm';
import { LoginScreen } from '@/components/LoginScreen';
import { Users, Trophy, Medal, BarChart3, ChevronLeft, Tent, LogOut, User } from 'lucide-react';

type Tab = 'athletes' | 'tournaments' | 'results' | 'ranking' | 'camps';
type CampsView = 'list' | 'detail';
type ResultsView = 'list' | 'tournament';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('athletes');
  const [resultsView, setResultsView] = useState<ResultsView>('list');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  // Training Camps state
  const [campsView, setCampsView] = useState<CampsView>('list');
  const [selectedCampId, setSelectedCampId] = useState<string | null>(null);

  // Hooks
  const { 
    athletes, 
    isLoading: isLoadingAthletes, 
    addAthlete, 
    updateAthlete, 
    deleteAthlete, 
    importAthletes 
  } = useAthletes();

  // Auth
  const { user, isAuthenticated, isLoading: isLoadingAuth, signOut } = useAuth();

  const {
    tournaments,
    tournamentLevels,
    isLoading: isLoadingTournaments,
    addTournament,
    updateTournament,
    deleteTournament,
    completeTournament,
    addTournamentLevel,
    updateTournamentLevel,
    deleteTournamentLevel,
    getLevelById,
    getTournamentsByLevel,
  } = useTournaments();

  const {
    results: allResults,
    isLoading: isLoadingResults,
    getResultsByTournament,
    addResult,
    updateResult,
    deleteResult,
    getRanking,
    importResults,
  } = useResults();

  // Training Camps hook
  const {
    camps,
    isLoading: isLoadingCamps,
    addCamp,
    updateCamp,
    deleteCamp,
    duplicateCamp,
  } = useTrainingCamps();

  // Results state
  const [tournamentResults, setTournamentResults] = useState<TournamentResultWithDetails[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingFilters, setRankingFilters] = useState<RankingFilters>({});
  const [isLoadingTournamentResults, setIsLoadingTournamentResults] = useState(false);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  // Modal states - Athletes
  const [isAthleteFormOpen, setIsAthleteFormOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isAthleteDeleteOpen, setIsAthleteDeleteOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [deletingAthlete, setDeletingAthlete] = useState<Athlete | null>(null);
  const [athleteFormError, setAthleteFormError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{imported: number; updated: number; skipped: number} | null>(null);

  // Modal states - Tournaments
  const [isTournamentFormOpen, setIsTournamentFormOpen] = useState(false);
  const [isLevelManagerOpen, setIsLevelManagerOpen] = useState(false);
  const [isTournamentDeleteOpen, setIsTournamentDeleteOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [tournamentFormError, setTournamentFormError] = useState<string | null>(null);

  // Modal states - Results
  const [isResultFormOpen, setIsResultFormOpen] = useState(false);
  const [isResultImportOpen, setIsResultImportOpen] = useState(false);
  const [isResultDeleteOpen, setIsResultDeleteOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<TournamentResultWithDetails | null>(null);
  const [deletingResult, setDeletingResult] = useState<TournamentResultWithDetails | null>(null);
  const [resultFormError, setResultFormError] = useState<string | null>(null);
  const [importResultsNotification, setImportResultsNotification] = useState<{imported: number; skipped: number; overwritten: number; errors: string[]} | null>(null);

  // Modal state - Athlete Detail
  const [selectedAthleteForDetail, setSelectedAthleteForDetail] = useState<Athlete | null>(null);
  const [isAthleteDetailOpen, setIsAthleteDetailOpen] = useState(false);

  // Modal states - Training Camps
  const [isCampFormOpen, setIsCampFormOpen] = useState(false);
  const [isCampDeleteOpen, setIsCampDeleteOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<TrainingCamp | null>(null);
  const [deletingCamp, setDeletingCamp] = useState<TrainingCamp | null>(null);
  const [campFormError, setCampFormError] = useState<string | null>(null);
  const [duplicateCampDates, setDuplicateCampDates] = useState<{ start_date: string; end_date: string } | null>(null);

  // Get selected tournament
  const selectedTournament = useMemo(() => {
    if (!selectedTournamentId) return null;
    return tournaments.find(t => t.id === selectedTournamentId) || null;
  }, [selectedTournamentId, tournaments]);

  // Get selected camp
  const selectedCamp = useMemo(() => {
    if (!selectedCampId) return null;
    return camps.find(c => c.id === selectedCampId) || null;
  }, [selectedCampId, camps]);

  // Get completed tournaments
  const completedTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'completed');
  }, [tournaments]);

  // Get available years for ranking filter
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    tournaments.forEach(t => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [tournaments]);

  // Load tournament results when selected
  useEffect(() => {
    if (selectedTournamentId && resultsView === 'tournament') {
      setIsLoadingTournamentResults(true);
      getResultsByTournament(selectedTournamentId).then(data => {
        setTournamentResults(data);
        setIsLoadingTournamentResults(false);
      });
    }
  }, [selectedTournamentId, resultsView, getResultsByTournament]);

  // BUG-2 Fix: Load ranking when filters change (with debouncing)
  useEffect(() => {
    setIsLoadingRanking(true);
    
    // 500ms debounce to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      getRanking(rankingFilters).then(data => {
        setRanking(data);
        setIsLoadingRanking(false);
      });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [rankingFilters, getRanking]);

  // Loading state
  const isLoading = isLoadingAthletes || isLoadingTournaments || isLoadingResults || isLoadingCamps;

  // ===== Athlete Handlers =====
  const handleAddNewAthlete = () => {
    setEditingAthlete(null);
    setAthleteFormError(null);
    setIsAthleteFormOpen(true);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setAthleteFormError(null);
    setIsAthleteFormOpen(true);
  };

  const handleDeleteAthlete = (athlete: Athlete) => {
    setDeletingAthlete(athlete);
    setIsAthleteDeleteOpen(true);
  };

  const handleSaveAthlete = (data: Omit<Athlete, 'id' | 'import_id' | 'created_at' | 'updated_at'>) => {
    setAthleteFormError(null);
    
    if (editingAthlete) {
      updateAthlete(editingAthlete.id, data).then((result) => {
        if (result.success) {
          setIsAthleteFormOpen(false);
          setEditingAthlete(null);
        } else {
          setAthleteFormError(result.error || 'Fehler beim Speichern');
        }
      });
    } else {
      addAthlete(data).then((result) => {
        if (result.success) {
          setIsAthleteFormOpen(false);
        } else {
          setAthleteFormError(result.error || 'Fehler beim Anlegen');
        }
      });
    }
  };

  const handleConfirmDeleteAthlete = () => {
    if (deletingAthlete) {
      deleteAthlete(deletingAthlete.id);
      setIsAthleteDeleteOpen(false);
      setDeletingAthlete(null);
    }
  };

  const handleImport = (newAthletes: Partial<Athlete>[], conflicts: Map<number, 'skip' | 'update' | 'create'>) => {
    importAthletes(newAthletes, conflicts).then((result) => {
      setImportResult({
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped
      });
      
      setTimeout(() => setImportResult(null), 5000);
    });
  };

  // ===== Tournament Handlers =====
  const handleAddNewTournament = () => {
    setEditingTournament(null);
    setTournamentFormError(null);
    setIsTournamentFormOpen(true);
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setTournamentFormError(null);
    setIsTournamentFormOpen(true);
  };

  const handleDeleteTournament = (tournament: Tournament) => {
    setDeletingTournament(tournament);
    setIsTournamentDeleteOpen(true);
  };

  const handleCompleteTournament = (tournament: Tournament) => {
    completeTournament(tournament.id);
  };

  const handleSaveTournament = (data: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>) => {
    setTournamentFormError(null);
    
    if (editingTournament) {
      updateTournament(editingTournament.id, data).then((result) => {
        if (result.success) {
          setIsTournamentFormOpen(false);
          setEditingTournament(null);
        } else {
          setTournamentFormError(result.error || 'Fehler beim Speichern');
        }
      });
    } else {
      addTournament(data).then((result) => {
        if (result.success) {
          setIsTournamentFormOpen(false);
        } else {
          setTournamentFormError(result.error || 'Fehler beim Anlegen');
        }
      });
    }
  };

  const handleConfirmDeleteTournament = () => {
    if (deletingTournament) {
      deleteTournament(deletingTournament.id);
      setIsTournamentDeleteOpen(false);
      setDeletingTournament(null);
    }
  };

  // ===== Results Handlers =====
  const handleSelectTournamentForResults = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setResultsView('tournament');
  };

  const handleBackToResultsList = () => {
    setResultsView('list');
    setSelectedTournamentId(null);
    setTournamentResults([]);
  };

  const handleAddResult = () => {
    setEditingResult(null);
    setResultFormError(null);
    setIsResultFormOpen(true);
  };

  const handleEditResult = (result: TournamentResultWithDetails) => {
    setEditingResult(result);
    setResultFormError(null);
    setIsResultFormOpen(true);
  };

  const handleDeleteResult = (result: TournamentResultWithDetails) => {
    setDeletingResult(result);
    setIsResultDeleteOpen(true);
  };

  const handleSaveResult = (data: Omit<TournamentResultWithDetails, 'id' | 'created_at' | 'updated_at'>) => {
    setResultFormError(null);
    
    if (editingResult) {
      updateResult(editingResult.id, {
        placement: data.placement,
        points: data.points,
      }).then((result) => {
        if (result.success) {
          setIsResultFormOpen(false);
          setEditingResult(null);
          // Refresh tournament results
          if (selectedTournamentId) {
            setIsLoadingTournamentResults(true);
            getResultsByTournament(selectedTournamentId).then(data => {
              setTournamentResults(data);
              setIsLoadingTournamentResults(false);
            });
          }
        } else {
          setResultFormError(result.error || 'Fehler beim Speichern');
        }
      });
    } else {
      addResult(data).then((result) => {
        if (result.success) {
          setIsResultFormOpen(false);
          // Refresh tournament results
          if (selectedTournamentId) {
            setIsLoadingTournamentResults(true);
            getResultsByTournament(selectedTournamentId).then(data => {
              setTournamentResults(data);
              setIsLoadingTournamentResults(false);
            });
          }
        } else {
          setResultFormError(result.error || 'Fehler beim Anlegen');
        }
      });
    }
  };

  const handleConfirmDeleteResult = () => {
    if (deletingResult) {
      deleteResult(deletingResult.id).then(() => {
        setIsResultDeleteOpen(false);
        setDeletingResult(null);
        // Refresh tournament results
        if (selectedTournamentId) {
          setIsLoadingTournamentResults(true);
          getResultsByTournament(selectedTournamentId).then(data => {
            setTournamentResults(data);
            setIsLoadingTournamentResults(false);
          });
        }
      });
    }
  };

  const handleImportCsv = () => {
    setIsResultImportOpen(true);
  };

  const handleImportResults = (rows: ParsedResultRow[], actions: Map<number, 'import' | 'skip' | 'create' | 'overwrite'>) => {
    if (!selectedTournament) return;

    importResults(selectedTournament.id, rows, actions, selectedTournament).then((result) => {
      setImportResultsNotification({
        imported: result.imported,
        skipped: result.skipped,
        overwritten: result.overwritten,
        errors: result.errors
      });

      setTimeout(() => setImportResultsNotification(null), 5000);

      // Refresh tournament results
      if (selectedTournamentId) {
        setIsLoadingTournamentResults(true);
        getResultsByTournament(selectedTournamentId).then(data => {
          setTournamentResults(data);
          setIsLoadingTournamentResults(false);
        });
      }
    });
  };

  // ===== Training Camps Handlers =====
  const handleAddNewCamp = () => {
    setEditingCamp(null);
    setCampFormError(null);
    setIsCampFormOpen(true);
  };

  const handleEditCamp = (camp: TrainingCamp) => {
    setEditingCamp(camp);
    setCampFormError(null);
    setIsCampFormOpen(true);
  };

  const handleDeleteCamp = (camp: TrainingCamp) => {
    setDeletingCamp(camp);
    setIsCampDeleteOpen(true);
  };

  const handleDuplicateCamp = (camp: TrainingCamp) => {
    // Get new dates for the duplicated camp
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    const startDate = camp.start_date.slice(0, 10);
    const endDate = camp.end_date.slice(0, 10);
    
    // For now, just duplicate with same dates - user can edit
    duplicateCamp(camp.id, { start_date: startDate, end_date: endDate });
  };

  const handleSelectCamp = (camp: TrainingCamp) => {
    setSelectedCampId(camp.id);
    setCampsView('detail');
  };

  const handleBackToCampsList = () => {
    setCampsView('list');
    setSelectedCampId(null);
  };

  const handleSaveCamp = (data: Omit<TrainingCamp, 'id' | 'created_at' | 'updated_at'>) => {
    setCampFormError(null);
    
    if (editingCamp) {
      updateCamp(editingCamp.id, data).then((result) => {
        if (result.success) {
          setIsCampFormOpen(false);
          setEditingCamp(null);
        } else {
          setCampFormError(result.error || 'Fehler beim Speichern');
        }
      });
    } else {
      addCamp(data).then((result) => {
        if (result.success) {
          setIsCampFormOpen(false);
        } else {
          setCampFormError(result.error || 'Fehler beim Anlegen');
        }
      });
    }
  };

  const handleConfirmDeleteCamp = () => {
    if (deletingCamp) {
      deleteCamp(deletingCamp.id);
      setIsCampDeleteOpen(false);
      setDeletingCamp(null);
      // If we're on the detail view of this camp, go back to list
      if (selectedCampId === deletingCamp.id) {
        setCampsView('list');
        setSelectedCampId(null);
      }
    }
  };

  // Show loading while checking auth
  if (isLoadingAuth) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </main>
    );
  }

  // Show login screen if not authenticated
  // Note: If Supabase is not configured, the app works in local-only mode without auth
  // This is detected by checking if supabase client is null
  const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  if (isSupabaseConfigured && !isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Athletendatenbank
            </h1>
            <p className="text-gray-600">
              Verwalten Sie Ihre Athleten, Turniere und behalten Sie den Überblick.
            </p>
          </div>
          
          {/* User Info & Logout - only show when Supabase is configured */}
          {isSupabaseConfigured && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email || 'Gast'}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </button>
            </div>
          )}
        </div>

        {/* Import Notifications */}
        {importResult && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <strong>Athleten-Import erfolgreich!</strong>
            <span className="ml-2">
              {importResult.imported} neu, {importResult.updated} aktualisiert, {importResult.skipped} übersprungen
            </span>
          </div>
        )}

        {importResultsNotification && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <strong>Ergebnis-Import erfolgreich!</strong>
            <span className="ml-2">
              {importResultsNotification.imported} importiert
              {importResultsNotification.overwritten > 0 && (
                <span className="text-orange-600">, {importResultsNotification.overwritten} überschrieben</span>
              )}
              , {importResultsNotification.skipped} übersprungen
            </span>
            {importResultsNotification.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                {importResultsNotification.errors.length} Fehler aufgetreten
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('athletes')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'athletes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Athleten
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {athletes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tournaments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Turniere
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tournaments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Medal className="w-4 h-4" />
              Ergebnisse
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ranking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Rangliste
            </button>
            <button
              onClick={() => setActiveTab('camps')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'camps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tent className="w-4 h-4" />
              Trainingscamps
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {camps.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'athletes' && (
          <AthleteList
            athletes={athletes}
            onEdit={handleEditAthlete}
            onDelete={handleDeleteAthlete}
            onAddNew={handleAddNewAthlete}
            onImportCsv={() => setIsCsvOpen(true)}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentList
            tournaments={tournaments}
            tournamentLevels={tournamentLevels}
            onEdit={handleEditTournament}
            onDelete={handleDeleteTournament}
            onAddNew={handleAddNewTournament}
            onManageLevels={() => setIsLevelManagerOpen(true)}
            onComplete={handleCompleteTournament}
          />
        )}

        {activeTab === 'results' && (
          <div>
            {resultsView === 'list' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Turnierergebnisse</h2>
                </div>
                
                {completedTournaments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-400 mb-2">
                      <Trophy className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Keine abgeschlossenen Turniere</h3>
                    <p className="text-gray-500 mb-4">
                      Es gibt noch keine abgeschlossenen Turniere. Schließen Sie ein Turnier ab, um Ergebnisse zu importieren.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Turnier</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Datum</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ort</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Ergebnisse</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Aktion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedTournaments.map((tournament) => {
                          const resultCount = allResults.filter(r => r.tournament_id === tournament.id).length;
                          return (
                            <tr key={tournament.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{tournament.name}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {new Date(tournament.date).toLocaleDateString('de-DE')}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{tournament.location || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  resultCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {resultCount}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleSelectTournamentForResults(tournament.id)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                  Ergebnisse anzeigen
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : selectedTournament ? (
              <div>
                <button
                  onClick={handleBackToResultsList}
                  className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Zurück zur Übersicht
                </button>
                <ResultList
                  tournament={selectedTournament}
                  results={tournamentResults}
                  onAddResult={handleAddResult}
                  onEditResult={handleEditResult}
                  onDeleteResult={handleDeleteResult}
                  onImportCsv={handleImportCsv}
                  isLoading={isLoadingTournamentResults}
                />
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'ranking' && (
          <RankingList
            ranking={ranking}
            isLoading={isLoadingRanking}
            filters={rankingFilters}
            onFiltersChange={setRankingFilters}
            availableYears={availableYears}
            tournaments={completedTournaments}
            tournamentLevels={tournamentLevels}
            onAthleteClick={(athlete) => {
              setSelectedAthleteForDetail(athlete);
              setIsAthleteDetailOpen(true);
            }}
          />
        )}

        {activeTab === 'camps' && (
          <div>
            {campsView === 'list' ? (
              <CampList
                camps={camps}
                onEdit={handleEditCamp}
                onDelete={handleDeleteCamp}
                onAddNew={handleAddNewCamp}
                onDuplicate={handleDuplicateCamp}
                onSelect={handleSelectCamp}
              />
            ) : selectedCamp ? (
              <CampDetail
                camp={selectedCamp}
                athletes={athletes}
                onBack={handleBackToCampsList}
                onEdit={handleEditCamp}
                onDelete={handleDeleteCamp}
              />
            ) : null}
          </div>
        )}

        {/* Athlete Modals */}
        <AthleteForm
          athlete={editingAthlete}
          isOpen={isAthleteFormOpen}
          onClose={() => {
            setIsAthleteFormOpen(false);
            setEditingAthlete(null);
            setAthleteFormError(null);
          }}
          onSave={handleSaveAthlete}
          error={athleteFormError}
        />

        <CsvImport
          isOpen={isCsvOpen}
          onClose={() => setIsCsvOpen(false)}
          existingAthletes={athletes}
          onImport={handleImport}
        />

        <DeleteConfirm
          athlete={deletingAthlete}
          isOpen={isAthleteDeleteOpen}
          onClose={() => {
            setIsAthleteDeleteOpen(false);
            setDeletingAthlete(null);
          }}
          onConfirm={handleConfirmDeleteAthlete}
        />

        {/* Tournament Modals */}
        <TournamentForm
          tournament={editingTournament}
          tournamentLevels={tournamentLevels}
          isOpen={isTournamentFormOpen}
          onClose={() => {
            setIsTournamentFormOpen(false);
            setEditingTournament(null);
            setTournamentFormError(null);
          }}
          onSave={handleSaveTournament}
          error={tournamentFormError}
        />

        <TournamentLevelManager
          levels={tournamentLevels}
          isOpen={isLevelManagerOpen}
          onClose={() => setIsLevelManagerOpen(false)}
          onAdd={addTournamentLevel}
          onUpdate={updateTournamentLevel}
          onDelete={deleteTournamentLevel}
          getTournamentsByLevel={getTournamentsByLevel}
        />

        <TournamentDeleteConfirm
          tournament={deletingTournament}
          tournamentLevel={deletingTournament ? getLevelById(deletingTournament.level_id) : undefined}
          isOpen={isTournamentDeleteOpen}
          onClose={() => {
            setIsTournamentDeleteOpen(false);
            setDeletingTournament(null);
          }}
          onConfirm={handleConfirmDeleteTournament}
        />

        {/* Results Modals */}
        {selectedTournament && (
          <>
            <ResultForm
              result={editingResult}
              tournament={selectedTournament}
              athletes={athletes}
              isOpen={isResultFormOpen}
              onClose={() => {
                setIsResultFormOpen(false);
                setEditingResult(null);
                setResultFormError(null);
              }}
              onSave={handleSaveResult}
              error={resultFormError}
            />

            <ResultImport
              isOpen={isResultImportOpen}
              onClose={() => setIsResultImportOpen(false)}
              tournament={selectedTournament}
              athletes={athletes}
              onImport={handleImportResults}
              existingResults={tournamentResults.map(r => ({ athlete_id: r.athlete_id, placement: r.placement, result_id: r.id }))}
            />
          </>
        )}

        <ResultDeleteConfirm
          result={deletingResult}
          isOpen={isResultDeleteOpen}
          onClose={() => {
            setIsResultDeleteOpen(false);
            setDeletingResult(null);
          }}
          onConfirm={handleConfirmDeleteResult}
        />

        {/* Athlete Detail Modal */}
        <AthleteDetailModal
          athlete={selectedAthleteForDetail}
          isOpen={isAthleteDetailOpen}
          onClose={() => {
            setIsAthleteDetailOpen(false);
            setSelectedAthleteForDetail(null);
          }}
        />

        {/* Training Camps Modals */}
        <CampForm
          camp={editingCamp}
          isOpen={isCampFormOpen}
          onClose={() => {
            setIsCampFormOpen(false);
            setEditingCamp(null);
            setCampFormError(null);
          }}
          onSave={handleSaveCamp}
          error={campFormError}
        />

        <CampDeleteConfirm
          camp={deletingCamp}
          participantCount={0}
          isOpen={isCampDeleteOpen}
          onClose={() => {
            setIsCampDeleteOpen(false);
            setDeletingCamp(null);
          }}
          onConfirm={handleConfirmDeleteCamp}
        />
      </div>
    </main>
  );
}