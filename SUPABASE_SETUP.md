# Supabase Setup für Athletendatenbank

## 1. Supabase-Projekt erstellen

1. Gehe zu https://supabase.com und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Warte bis die Datenbank bereit ist (ca. 2 Minuten)

## 2. Datenbank-Schema

Gehe im Supabase-Dashboard zu "SQL Editor" und führe folgendes SQL aus:

```sql
-- Athleten-Tabelle erstellen
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

-- Index für Import-ID (schnelle Duplikat-Prüfung)
CREATE INDEX idx_athletes_import_id ON athletes(import_id);

-- Index für häufige Filter
CREATE INDEX idx_athletes_birth_year ON athletes(birth_year);
CREATE INDEX idx_athletes_gender ON athletes(gender);
CREATE INDEX idx_athletes_last_name ON athletes(last_name);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_athletes_updated_at 
  BEFORE UPDATE ON athletes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## 3. API-Keys holen

Gehe zu "Project Settings" → "API":

- **Project URL**: Kopiere die URL (z.B. `https://xxxxx.supabase.co`)
- **anon public**: Kopiere den anon key (starts mit `eyJ...`)

## 4. In der App eintragen

Erstelle eine `.env.local` Datei im Projekt-Root:

```
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
```

## 5. Fertig!

Starte die App neu mit:
```bash
npm run dev
```

Die Daten werden jetzt in Supabase gespeichert statt in localStorage.
