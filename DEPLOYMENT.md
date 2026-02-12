# Deployment Guide: Athletendatenbank

## Vercel Deployment

### 1. Vercel Projekt erstellen

1. Gehe zu https://vercel.com und logge dich ein
2. Klicke "Add New Project"
3. Importiere aus GitHub (oder lade den Ordner hoch)
4. Wähle das Repository: `athletendatenbank`

### 2. Build Settings

**Framework Preset:** Next.js

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

### 3. Environment Variables

Füge diese Environment Variables in Vercel Dashboard → Settings → Environment Variables hinzu:

```
NEXT_PUBLIC_SUPABASE_URL=https://deine-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Wichtig:** 
- Die Werte bekommst du aus deinem Supabase Dashboard
- `NEXT_PUBLIC_` Prefix ist wichtig für Client-Side Zugriff

### 4. Deploy

1. Klicke "Deploy"
2. Warte auf den Build (ca. 2-3 Minuten)
3. Die Production URL wird angezeigt (z.B. `https://athletendatenbank-xyz.vercel.app`)

### 5. Erster Login

1. Öffne die Production URL
2. Du siehst den Login-Screen
3. **Erstelle einen Account:**
   - Gehe zu deinem Supabase Dashboard
   - Authentication → Users → Invite User
   - Gib deine Email ein
   - Setze ein Passwort
4. Logge dich in der App ein

### 6. RLS Policies aktivieren

Führe im Supabase SQL Editor aus:

```sql
-- RLS für alle Tabellen aktivieren
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_camps ENABLE ROW LEVEL SECURITY;

-- Policies für athletes
CREATE POLICY "Allow read for authenticated users" ON athletes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON athletes
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies für tournaments
CREATE POLICY "Allow read for authenticated users" ON tournaments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON tournaments
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies für tournament_results
CREATE POLICY "Allow read for authenticated users" ON tournament_results
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON tournament_results
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies für training_camps
CREATE POLICY "Allow read for authenticated users" ON training_camps
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON training_camps
  FOR ALL USING (auth.role() = 'authenticated');
```

### 7. Fertig! 🎉

Die App ist jetzt live und geschützt durch Authentifizierung.

---

## Lokale Entwicklung (ohne Auth)

Für lokale Entwicklung ohne Supabase:

1. Lösche oder kommentiere die Environment Variables aus
2. Die App läuft dann im "local-only" Modus ohne Login
3. Daten werden im Browser localStorage gespeichert

---

## Troubleshooting

### Build Failed

**Problem:** Build schlägt fehl  
**Lösung:**
1. Prüfe die Logs in Vercel Dashboard
2. Stelle sicher, dass `npm run build` lokal funktioniert
3. Prüfe, ob alle Dependencies in `package.json` vorhanden sind

### "Supabase URL nicht gefunden"

**Problem:** Environment Variables fehlen  
**Lösung:**
1. Gehe zu Vercel Dashboard → Settings → Environment Variables
2. Füge `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` hinzu
3. Redeploy

### Login funktioniert nicht

**Problem:** Auth funktioniert nicht in Production  
**Lösung:**
1. Prüfe, ob die Environment Variables korrekt sind
2. Prüfe, ob RLS Policies in Supabase aktiviert sind
3. Prüfe Browser Console für Errors

---

## Support

Bei Fragen oder Problemen:
1. Vercel Docs: https://vercel.com/docs
2. Supabase Docs: https://supabase.com/docs
3. Next.js Docs: https://nextjs.org/docs
