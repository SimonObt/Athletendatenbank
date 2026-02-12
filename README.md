# Athletendatenbank

Eine moderne Web-Anwendung zur Verwaltung von Athleten, Turnieren, Ranglisten und Trainingscamps.

🔗 **Live Demo:** [Hier einfügen nach Deployment]

## Features

- 📊 **Athletenverwaltung** - Import, Bearbeitung und Verwaltung aller Athleten
- 🏆 **Turnierverwaltung** - Turniere anlegen, Ergebnisse importieren
- 📈 **Ranglisten** - Automatische Ranglisten mit Filterfunktion
- 🏕️ **Trainingscamps** - Camps organisieren, Teilnehmer verwalten
- 🔐 **Authentifizierung** - Sicherer Login mit Supabase Auth

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth)
- **Charts:** Recharts
- **Icons:** Lucide React

## Installation

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- Supabase Account

### Schritt 1: Repository klonen

```bash
git clone https://github.com/SimonObt/Athletendatenbank.git
cd Athletendatenbank
```

### Schritt 2: Abhängigkeiten installieren

```bash
npm install
```

### Schritt 3: Environment Variables

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_supabase_anon_key
```

Die Werte findest du in deinem Supabase Dashboard unter **Project Settings → API**.

### Schritt 4: Supabase Schema einrichten

Führe im Supabase SQL Editor folgende Befehle aus:

```sql
-- Athleten-Tabelle
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

-- Turniere-Tabelle
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  tournament_level_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnierergebnisse-Tabelle
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  placement INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainingscamps-Tabelle
CREATE TABLE training_camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies für Authentifizierung
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_camps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON athletes 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tournaments 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON tournament_results 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON training_camps 
  FOR ALL USING (auth.role() = 'authenticated');
```

### Schritt 5: Ersten Account erstellen

1. Gehe zu deinem Supabase Dashboard
2. **Authentication → Users**
3. Klicke **"Add User"**
4. Gib deine Email und ein Passwort ein

### Schritt 6: Entwicklungsserver starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

## Deployment

### Vercel (empfohlen)

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke **"Add New Project"**
3. Importiere dein GitHub Repository
4. Füge die Environment Variables hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klicke **"Deploy"**

**Wichtig:** Das Supabase Schema muss vor dem ersten Deployment eingerichtet sein!

## Nutzung

### Athleten importieren

1. Bereite eine CSV-Datei vor mit folgenden Spalten:
   - `import_id` (eindeutige ID)
   - `first_name` (Vorname)
   - `last_name` (Nachname)
   - `gender` (männlich/weiblich/divers)
   - `birth_year` (Geburtsjahr, z.B. 2008)
   - Optional: `district`, `club`, `phone`, `email`

2. In der App: **"Athleten importieren"** → CSV auswählen → Hochladen

### Turnierergebnisse importieren

1. CSV-Datei mit:
   - `import_id` (der Athlet)
   - `placement` (Platzierung)
   - `tournament_id` (ID des Turniers)

2. **"Ergebnisse importieren"** → CSV auswählen → Hochladen

## Projektstruktur

```
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # UI Komponenten
│   ├── hooks/           # React Hooks
│   ├── lib/             # Supabase Client & API
│   └── types.ts         # TypeScript Typen
├── public/              # Statische Assets
├── features/            # Feature-Spezifikationen
└── README.md
```

## Features im Detail

### PROJ-1: Athleten anlegen ✅
- Manuelle Eingabe und CSV-Import
- Dubletten-Erkennung
- Validierung von Email und Telefon

### PROJ-2: Turniere anlegen ✅
- Turnierverwaltung mit Datum und Ort
- Verschiedene Turnierlevels

### PROJ-3: Turnierergebnisse importieren ✅
- CSV-Import mit Validierung
- Warnungen bei ungültigen Platzierungen
- Dubletten-Überschreiben Option

### PROJ-4: Rangliste mit Filter ✅
- Filter nach Geschlecht, Jahrgang, Bezirk
- Debounced Suche
- Geteilte Plätze
- Interaktive Charts

### PROJ-5: Trainingscamps ✅
- Camp-Verwaltung mit Teilnehmern
- Bestätigungsmodal vor Löschung

### PROJ-6: Authentifizierung & Vercel-Deployment ✅
- Supabase Auth Integration
- Geschützte Routen
- Vercel-Ready

## Troubleshooting

### "Supabase URL not found"
- Prüfe, ob `.env.local` existiert und die Variablen korrekt sind
- Variablen müssen mit `NEXT_PUBLIC_` beginnen

### "Cannot find module"
- `npm install` ausführen
- Node.js Version prüfen (min. 18)

### Login funktioniert nicht
- Supabase RLS Policies prüfen (siehe Schritt 4)
- User im Supabase Dashboard unter Authentication → Users erstellen

### Build-Fehler bei Vercel
- `next.config.js` darf kein `output: 'export'` enthalten
- Environment Variables müssen im Vercel Dashboard gesetzt sein

## Support

Bei Fragen oder Problemen:
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Tailwind Docs: [tailwindcss.com/docs](https://tailwindcss.com/docs)

## Lizenz

MIT

---

Erstellt mit ❤️ für den Judosport
