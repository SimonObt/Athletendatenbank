export interface Athlete {
  id: string;
  import_id: string;
  first_name: string;
  last_name: string;
  gender: 'männlich' | 'weiblich' | 'divers';
  birth_year: number;
  district?: string;
  club?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface CsvAthlete {
  Nachname: string;
  Vorname: string;
  Geschlecht: string;
  Jahrgang: string;
  Bezirk?: string;
  Verein?: string;
  Telefon?: string;
  Email?: string;
}

export interface ImportConflict {
  csvData: Partial<Athlete>;
  existingAthlete: Athlete | null;
  action: 'skip' | 'update' | 'create';
}

// Tournament Types
export interface TournamentLevel {
  id: string;
  name: string;
  points_place_1: number;
  points_place_2: number;
  points_place_3: number;
  points_place_5: number;
  points_place_7: number;
  created_at: string;
  updated_at: string;
}

export type TournamentStatus = 'planned' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  level_id: string;
  date: string;
  location?: string;
  description?: string;
  age_group?: string;
  status: TournamentStatus;
  // Copied points from level (for historical correctness)
  points_place_1: number;
  points_place_2: number;
  points_place_3: number;
  points_place_5: number;
  points_place_7: number;
  created_at: string;
  updated_at: string;
}

// Extended tournament with level info for display
export interface TournamentWithLevel extends Tournament {
  level?: TournamentLevel;
}

// Tournament Results Types (PROJ-3)
export type Placement = 1 | 2 | 3 | 5 | 7;

export interface TournamentResult {
  id: string;
  tournament_id: string;
  athlete_id: string;
  placement: Placement;
  points: number;
  is_manual: boolean;
  imported_at?: string;
  created_at: string;
  updated_at: string;
}

// Extended result with athlete and tournament info for display
export interface TournamentResultWithDetails extends TournamentResult {
  athlete?: Athlete;
  tournament?: Tournament;
}

// CSV Import Types for Results
export interface CsvResultRow {
  Nachname?: string;
  Vorname?: string;
  Name?: string;
  Jahrgang?: string;
  Verein?: string;
  Geschlecht?: string;
  Platz?: string;
  Platzierung?: string;
}

// Ranking Types
export interface RankingEntry {
  athlete_id: string;
  athlete: Athlete;
  total_points: number;
  tournament_count: number;
  results: TournamentResultWithDetails[];
  rank?: number;
}

export interface RankingFilters {
  year?: number;
  gender?: 'männlich' | 'weiblich' | 'divers';
  birthYearMin?: number;
  birthYearMax?: number;
  ageGroup?: string;
  tournamentLevels?: string[];
  tournamentId?: string;
}

// Athlete detail view types
export interface AthleteDetailedResult {
  result: TournamentResultWithDetails;
  tournament: Tournament;
  date: string;
}

export interface AthleteStats {
  totalTournaments: number;
  totalPoints: number;
  averagePlacement: number;
  bestPlacement: Placement | null;
  resultsByYear: Record<number, AthleteDetailedResult[]>;
  pointsProgression: { date: string; cumulativePoints: number; tournamentName: string }[];
}

// Match status for fuzzy matching
export type MatchStatus = 'exact' | 'similar' | 'unknown';

export interface ParsedResultRow {
  rowIndex: number;
  firstName: string;
  lastName: string;
  birthYear?: number;
  club?: string;
  gender?: string;
  placement: Placement;
  matchedAthlete?: Athlete;
  matchStatus: MatchStatus;
  matchConfidence?: number;
  similarAthletes?: Athlete[];
}

// Training Camp Types (PROJ-5)
export type CampStatus = 'geplant' | 'nominierung' | 'bestätigt' | 'abgeschlossen';
export type ParticipantStatus = 'vorgeschlagen' | 'eingeladen' | 'zugesagt' | 'abgesagt' | 'nachgerückt';

export interface TrainingCamp {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CampStatus;
  location?: string;
  description?: string;
  capacity?: number;
  cost_per_person?: number;
  registration_deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface CampParticipant {
  id: string;
  camp_id: string;
  athlete_id: string;
  status: ParticipantStatus;
  comment?: string;
  added_at: string;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
}

// Extended participant with athlete info for display
export interface CampParticipantWithDetails extends CampParticipant {
  athlete?: Athlete;
}

// Extended camp with participants for display
export interface TrainingCampWithDetails extends TrainingCamp {
  participants?: CampParticipantWithDetails[];
  participant_count?: number;
  confirmed_count?: number;
}

export interface CampFilters {
  status?: CampStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Status workflow constants
export const CAMP_STATUS_FLOW: Record<CampStatus, CampStatus[]> = {
  'geplant': ['nominierung'],
  'nominierung': ['bestätigt', 'geplant'],
  'bestätigt': ['abgeschlossen', 'nominierung'],
  'abgeschlossen': ['bestätigt'],
};

export const PARTICIPANT_STATUS_FLOW: Record<ParticipantStatus, ParticipantStatus[]> = {
  'vorgeschlagen': ['eingeladen'],
  'eingeladen': ['zugesagt', 'abgesagt'],
  'zugesagt': ['abgesagt'],
  'abgesagt': ['nachgerückt'],
  'nachgerückt': ['zugesagt'],
};
