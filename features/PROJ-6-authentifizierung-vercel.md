# PROJ-6: Authentifizierung & Vercel-Deployment

## Status: 🔵 Planned (Post-MVP / Nice-to-have)

## Priorität
**Niedrig** – Wird als letztes Feature implementiert, nachdem alle Kernfunktionen (PROJ-1 bis PROJ-5) stabil laufen.

---

## Zusammenfassung
Login-System für einzelnen Admin-User (Simon) mit Email/Passwort. Ermöglicht Deployment auf Vercel mit Zugriffsschutz. Supabase bleibt als Datenbank-Backend aktiv.

---

## User Stories

### Als Landestrainer möchte ich...
- ...mich mit Email und Passwort einloggen, um die Athletendatenbank zu öffnen
- ...beim Öffnen der App einen Login-Screen sehen, falls ich nicht eingeloggt bin
- ...eingeloggt bleiben (Session), bis ich mich aktiv auslogge oder der Token abläuft
- ...mein Passwort ändern können
- ...die App auf Vercel deployen können, ohne dass Fremde Zugriff auf die Daten haben

---

## Acceptance Criteria

### Login-Screen
- [ ] Beim ersten Öffnen der App wird ein Login-Screen angezeigt
- [ ] Login-Screen enthält: Email-Input, Passwort-Input, Login-Button
- [ ] Bei erfolgreichem Login → Weiterleitung zur Athleten-Übersicht
- [ ] Bei falschem Passwort → Fehlermeldung: "Ungültige Email oder Passwort"
- [ ] "Eingeloggt bleiben" Checkbox (optional, 30 Tage Session)

### Session-Management
- [ ] Nach Login bleibt User eingeloggt (JWT Token in localStorage/cookie)
- [ ] Token läuft nach 30 Tagen ab (oder bei Logout)
- [ ] Session wird bei App-Neustart wiederhergestellt (wenn Token gültig)
- [ ] Logout-Button in Header/Navigation

### Sicherheit
- [ ] Passwort wird niemals im Klartext gespeichert (Supabase Auth)
- [ ] Geschützte Routen: Ohne Login keine Zugriff auf Athleten/Turniere/etc.
- [ ] Auto-Redirect zu Login bei ungültigem/abgelaufenem Token

### Vercel-Deployment
- [ ] App läuft auf Vercel mit denselben Supabase-Daten
- [ ] Environment-Variablen für Supabase + Auth korrekt konfiguriert
- [ ] Build erfolgreich ohne lokale Abhängigkeiten

---

## Edge Cases

### EC-1: Erster Login / Account-Erstellung
**Szenario:** Es existiert noch kein Account
**Lösung:** Einmaliger Setup-Flow nach erstem Deployment:
- Login-Screen zeigt zusätzlich "Erstaccount erstellen" (nur wenn keine Users in DB)
- Oder: Manuelle Account-Erstellung direkt in Supabase Dashboard

### EC-2: Passwort vergessen
**Szenario:** User kennt Passwort nicht mehr
**Lösung:** 
- "Passwort vergessen?" Link auf Login-Screen
- Email mit Reset-Link wird gesendet (Supabase Auth)
- Oder: Manuelles Zurücksetzen im Supabase Dashboard (MVP-Version)

### EC-3: Token abgelaufen
**Szenario:** User öffnet App nach 30+ Tagen
**Lösung:** Automatische Weiterleitung zu Login-Screen mit Hinweis: "Session abgelaufen, bitte erneut einloggen"

### EC-4: Mehrere Geräte
**Szenario:** User ist auf Laptop + Handy gleichzeitig eingeloggt
**Lösung:** Erlaubt – Supabase Auth unterstützt multiple Sessions pro User

### EC-5: Offline-Nutzung
**Szenario:** Kein Internet, aber App geöffnet
**Lösung:** 
- Token ist im localStorage → User bleibt eingeloggt
- Daten werden aus Cache/localStorage geladen (Offline-Modus)
- Bei Aktionen: "Keine Verbindung" Hinweis

---

## Technische Anforderungen

### Supabase Auth Setup
- **Tabelle:** `auth.users` (wird von Supabase verwaltet)
- **Methode:** Email + Passwort
- **RLS Policies:** Athleten/Turniere nur für authentifizierte User sichtbar

### Datenbank-Änderungen
```sql
-- RLS für athletes Tabelle aktivieren
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Policy: Nur eingeloggte User können lesen
CREATE POLICY "Allow read for authenticated users" ON athletes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Nur eingeloggte User können schreiben
CREATE POLICY "Allow write for authenticated users" ON athletes
  FOR ALL USING (auth.role() = 'authenticated');
```

### Frontend-Änderungen
- Neue Route: `/login` – Login-Screen
- Auth-Context: `src/contexts/AuthContext.tsx` – Session-Status global verfügbar
- Protected Route Wrapper: Leitet zu `/login` um wenn nicht authentifiziert
- Header-Update: Zeigt Email + Logout-Button

### Vercel-Config
- `vercel.json` – Routing für Next.js
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Abhängigkeiten
- **Benötigt:** PROJ-1 (Athleten anlegen) – Grundstruktur der App
- **Empfohlen:** PROJ-2 bis PROJ-5 abgeschlossen – Alle Features vor Deployment

---

## Out of Scope (für später)
- [ ] Mehrere User-Accounts (Team-Funktion)
- [ ] Rollen/Rechte (Admin vs. Viewer)
- [ ] OAuth (Google/Apple Login)
- [ ] 2-Faktor-Authentifizierung

---

## Schätzung
**Aufwand:** 1-2 Tage (Supabase Auth macht den Großteil)
**Komplexität:** Mittel (hauptsächlich Integration, wenig Eigenentwicklung)
