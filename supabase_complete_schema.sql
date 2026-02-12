-- =====================================================
-- KOMPLETTES KORRIGIERTES SUPABASE SCHEMA
-- Athletendatenbank - Alle Tabellen mit korrekten Spalten
-- =====================================================

-- 1. TURNIERLEVELS (mit Punkten)
DROP TABLE IF EXISTS tournament_levels CASCADE;

CREATE TABLE tournament_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  points_place_1 INTEGER DEFAULT 0,
  points_place_2 INTEGER DEFAULT 0,
  points_place_3 INTEGER DEFAULT 0,
  points_place_5 INTEGER DEFAULT 0,
  points_place_7 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tournament_levels (name, points_place_1, points_place_2, points_place_3, points_place_5, points_place_7) VALUES
  ('Landesliga', 8, 6, 4, 2, 1),
  ('Bezirksliga', 6, 4, 2, 1, 0),
  ('Kreisklasse', 4, 3, 2, 1, 0),
  ('Regional', 10, 7, 5, 3, 1),
  ('National', 12, 9, 6, 3, 1);

-- 2. ATHLETEN
DROP TABLE IF EXISTS athletes CASCADE;

CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('männlich', 'weiblich', 'divers')),
  birth_year INTEGER NOT NULL CHECK (birth_year BETWEEN 1900 AND 2030),
  district TEXT,
  club TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TURNIERE (mit allen Spalten die die App erwartet)
DROP TABLE IF EXISTS tournaments CASCADE;

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  age_group TEXT,
  level_id UUID REFERENCES tournament_levels(id),
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  points_place_1 INTEGER DEFAULT 0,
  points_place_2 INTEGER DEFAULT 0,
  points_place_3 INTEGER DEFAULT 0,
  points_place_5 INTEGER DEFAULT 0,
  points_place_7 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TURNIERERGEBNISSE (mit Punkten)
DROP TABLE IF EXISTS tournament_results CASCADE;

CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  placement INTEGER NOT NULL CHECK (placement IN (1, 2, 3, 5, 7)),
  points INTEGER DEFAULT 0,
  is_manual BOOLEAN DEFAULT false,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRAININGSCAMPS (mit allen Spalten)
DROP TABLE IF EXISTS training_camps CASCADE;

CREATE TABLE training_camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'nominierung', 'bestätigt', 'abgeschlossen')),
  location TEXT,
  description TEXT,
  capacity INTEGER,
  cost_per_person DECIMAL(10,2),
  registration_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CAMP TEILNEHMER (mit Status)
DROP TABLE IF EXISTS camp_participants CASCADE;

CREATE TABLE camp_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id UUID REFERENCES training_camps(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'vorgeschlagen' CHECK (status IN ('vorgeschlagen', 'eingeladen', 'zugesagt', 'abgesagt', 'nachgerückt')),
  comment TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES (Sicherheit)
-- =====================================================

ALTER TABLE tournament_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON tournament_levels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON athletes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tournament_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON training_camps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON camp_participants FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INDICES (Performance)
-- =====================================================

CREATE INDEX idx_athletes_import_id ON athletes(import_id);
CREATE INDEX idx_athletes_birth_year ON athletes(birth_year);
CREATE INDEX idx_athletes_gender ON athletes(gender);
CREATE INDEX idx_tournaments_date ON tournaments(date);
CREATE INDEX idx_tournaments_level ON tournaments(level_id);
CREATE INDEX idx_tournament_results_athlete ON tournament_results(athlete_id);
CREATE INDEX idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX idx_camp_participants_camp ON camp_participants(camp_id);
CREATE INDEX idx_camp_participants_athlete ON camp_participants(athlete_id);

-- =====================================================
-- FERTIG!
-- =====================================================
