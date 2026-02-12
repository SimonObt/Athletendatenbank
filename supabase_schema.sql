-- =====================================================
-- KOMPLETTES SUPABASE SCHEMA
-- Athletendatenbank - Alle Tabellen
-- =====================================================

-- 1. TURNIERLEVELS (zuerst erstellen, wird von tournaments referenziert)
CREATE TABLE IF NOT EXISTS tournament_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard Turnierlevels einfügen
INSERT INTO tournament_levels (name, description) VALUES
  ('Landesliga', 'Landesliga Turniere'),
  ('Bezirksliga', 'Bezirksliga Turniere'),
  ('Kreisklasse', 'Kreisklassen Turniere'),
  ('Regional', 'Regionale Turniere'),
  ('National', 'Nationale Turniere')
ON CONFLICT (name) DO NOTHING;

-- 2. ATHLETEN
CREATE TABLE IF NOT EXISTS athletes (
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

-- 3. TURNIERE
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  tournament_level_id UUID REFERENCES tournament_levels(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TURNIERERGEBNISSE
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  placement INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRAININGSCAMPS
CREATE TABLE IF NOT EXISTS training_camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CAMP TEILNEHMER
CREATE TABLE IF NOT EXISTS camp_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id UUID REFERENCES training_camps(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES (Sicherheit)
-- =====================================================

-- RLS für alle Tabellen aktivieren
ALTER TABLE tournament_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_participants ENABLE ROW LEVEL SECURITY;

-- Policies für tournament_levels
CREATE POLICY "Allow all for authenticated" ON tournament_levels FOR ALL USING (auth.role() = 'authenticated');

-- Policies für athletes
CREATE POLICY "Allow all for authenticated" ON athletes FOR ALL USING (auth.role() = 'authenticated');

-- Policies für tournaments
CREATE POLICY "Allow all for authenticated" ON tournaments FOR ALL USING (auth.role() = 'authenticated');

-- Policies für tournament_results
CREATE POLICY "Allow all for authenticated" ON tournament_results FOR ALL USING (auth.role() = 'authenticated');

-- Policies für training_camps
CREATE POLICY "Allow all for authenticated" ON training_camps FOR ALL USING (auth.role() = 'authenticated');

-- Policies für camp_participants
CREATE POLICY "Allow all for authenticated" ON camp_participants FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INDICES (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_athletes_import_id ON athletes(import_id);
CREATE INDEX IF NOT EXISTS idx_athletes_birth_year ON athletes(birth_year);
CREATE INDEX IF NOT EXISTS idx_athletes_gender ON athletes(gender);
CREATE INDEX IF NOT EXISTS idx_tournament_results_athlete ON tournament_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_camp_participants_camp ON camp_participants(camp_id);

-- =====================================================
-- FERTIG!
-- =====================================================
