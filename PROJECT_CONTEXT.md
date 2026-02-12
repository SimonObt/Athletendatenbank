# Athletendatenbank

## Vision
Eine Datenbank zur Verwaltung von Athleten-Informationen für das Judotraining.

## Tech Stack
- **Frontend:** Next.js 16 + React + TypeScript
- **Backend:** Supabase (PostgreSQL) mit localStorage-Fallback
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Aktueller Status

### Done ✅
- [x] PROJ-1: Athleten anlegen & verwalten (Frontend + Backend)

### In Progress 🟡
- 

### Planned 🔵
- [ ] PROJ-2: Turniere anlegen & verwalten
- [ ] PROJ-3: Turnierergebnisse importieren & Punktesystem
- [ ] PROJ-4: Rangliste mit Filterfunktion
- [ ] PROJ-5: Trainingscamps verwalten
- [ ] PROJ-6: Authentifizierung & Vercel-Deployment (Post-MVP)

## PROJ-1 Details

**Features implementiert:**
- ✅ Athleten manuell anlegen/bearbeiten/löschen
- ✅ CSV-Import mit Vorschau
- ✅ Duplikat-Erkennung über Import-ID
- ✅ Such- und Filterfunktion (Name, Geschlecht, Jahrgang)
- ✅ Supabase-Integration mit localStorage-Fallback

**Dateien:**
- `features/PROJ-1-athleten-anlegen.md` - Spezifikation
- `src/app/page.tsx` - Hauptseite
- `src/components/AthleteList.tsx` - Athleten-Tabelle
- `src/components/AthleteForm.tsx` - Formular (Neu/Bearbeiten)
- `src/components/CsvImport.tsx` - CSV-Import
- `src/hooks/useAthletes.ts` - Daten-Hook
- `src/lib/supabase.ts` - Supabase-Client
- `SUPABASE_SETUP.md` - Einrichtungsanleitung

## Projekt-Regeln
- Jedes Feature bekommt eine eigene PROJ-X.md Datei im `features/` Ordner
- Features werden erst spezifiziert (Requirements), dann designed (Architektur), dann implementiert
- Alle Features müssen durch QA bevor sie als "Done" gelten

## Wichtige Pfade
- **Projekt-Root:** `~/.openclaw/workspace/projects/athletendatenbank/`
- **Features:** `features/PROJ-X-feature-name.md`
- **Source:** `src/`

## Nächste Schritte
1. Supabase einrichten (optional - localStorage funktioniert sofort)
2. QA für PROJ-1 durchführen
3. PROJ-2 (Turniere) mit Requirements Engineer starten
