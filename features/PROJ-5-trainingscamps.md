# PROJ-5: Trainingscamps verwalten

## Status: ✅ Done (Post-MVP)

## Beschreibung
Verwaltung von Trainingscamps mit Athleten-Nominierung, Status-Tracking und Email-Export.

## User Stories

- Als Landestrainer möchte ich Trainingscamps anlegen können (Name, Datum, Ort, Beschreibung)
- Als Landestrainer möchte ich Athleten zu einem Trainingscamp hinzufügen können
- Als Landestrainer möchte ich den Status jedes Athleten festlegen können (nominiert, zugesagt, abgesagt, nachgerückt)
- Als Landestrainer möchte ich eine Übersicht über alle Athleten eines Camps sehen, gruppiert nach Status
- Als Landestrainer möchte ich die Email-Adressen aller Athleten mit einem bestimmten Status kopieren können (für Mail-Verteiler)
- Als Landestrainer möchte ich sehen, wie viele Plätze noch frei sind (Kapazitäts-Limit optional)
- Als Landestrainer möchte ich vergangene Camps archivieren können
- Als Landestrainer möchte ich ein Camp duplizieren können (für wiederkehrende Events)

## Datenfelder pro Trainingscamp

### Pflichtfelder
- [ ] Camp-Name (Text, max 200 Zeichen)
- [ ] Start-Datum (Date)
- [ ] End-Datum (Date)
- [ ] Status (geplant, aktiv, abgeschlossen, abgesagt)

### Optionale Felder
- [ ] Ort (Text, max 200 Zeichen)
- [ ] Beschreibung (Text, max 2000 Zeichen)
- [ ] Kapazität (Integer, max Anzahl Athleten)
- [ ] Kosten pro Person (Decimal)
- [ ] Anmelde-Deadline (Date)

### System-Felder
- [ ] Erstellt am (Timestamp)
- [ ] Anzahl Athleten (berechnet)

## Athleten-Status im Camp

Jeder Athlet im Camp hat einen Status:

| Status | Bedeutung | Farbe |
|--------|-----------|-------|
| **Nominiert** | Vorgeschlagen, wartet auf Antwort | 🟡 Gelb |
| **Zugesagt** | Hat zugesagt, nimmt teil | 🟢 Grün |
| **Abgesagt** | Hat abgesagt | 🔴 Rot |
| **Nachgerückt** | Ist nachgerückt für einen Abgesagten | 🔵 Blau |

### Status-Änderungen
- Nominiert → Zugesagt
- Nominiert → Abgesagt
- Abgesagt → Nachgerückt (anderer Athlet)
- Nachgerückt → Zugesagt

## Acceptance Criteria

### Camp anlegen
- [ ] Ich kann ein Formular öffnen für neues Camp
- [ ] Ich gebe Name, Datum (von-bis), Ort ein
- [ ] Ich kann optional Kapazität und Kosten angeben
- [ ] Nach Speichern erscheint das Camp in der Camp-Liste

### Athleten hinzufügen
- [ ] Ich öffne ein Camp und klicke "Athlet hinzufügen"
- [ ] Ich suche den Athleten (Autocomplete über alle Athleten)
- [ ] Ich wähle den initialen Status (Standard: nominiert)
- [ ] Ich kann mehrere Athleten nacheinander hinzufügen
- [ ] Das System zeigt an wie viele Plätze noch frei sind (wenn Kapazität gesetzt)

### Status verwalten
- [ ] Ich sehe eine Liste aller Athleten im Camp, gruppiert nach Status
- [ ] Ich kann den Status per Dropdown ändern
- [ ] Bei "Abgesagt" kann ich optional einen Kommentar eingeben (Grund)
- [ ] Bei "Nachgerückt" wird das Camp wieder als "nicht voll" markiert (wenn vorher voll)

### Email-Export
- [ ] Ich kann "Email-Adressen kopieren" klicken für:
  - Alle Athleten im Camp
  - Nur Zugesagte
  - Nur Nominierte
  - Nur Nachgerückte
- [ ] Die Emails werden komma-separiert in die Zwischenablage kopiert
- [ ] Format: "max@example.com, anna@example.com, ..."
- [ ] Ich sehe eine Bestätigung: "5 Email-Adressen kopiert"

### Camp-Übersicht
- [ ] Ich sehe alle Camps chronologisch (aktuelle zuerst)
- [ ] Ich sehe pro Camp: Name, Datum, Anzahl Athleten (X/Y wenn Kapazität)
- [ ] Ich kann nach Status filtern (geplant, aktiv, abgeschlossen)
- [ ] Ich kann ein Camp bearbeiten (nur wenn nicht abgeschlossen)
- [ ] Ich kann ein Camp duplizieren (für nächstes Jahr)

### Statistik pro Camp
- [ ] Anzahl nominiert / zugesagt / abgesagt / nachgerückt
- [ ] Auslastung in Prozent (wenn Kapazität gesetzt)
- [ ] Liste der abgesagten mit Grund (falls eingegeben)

## Edge Cases

### EC-1: Camp ist voll
- **Szenario:** Kapazität 20, 20 Athleten zugesagt
- **Lösung:** Warnung bei Versuch weiteren hinzuzufügen: "Camp ist voll. Trotzdem als Nachrücker hinzufügen?"

### EC-2: Athlet mehrfach hinzufügen
- **Szenario:** Gleicher Athlet soll zweimal zum selben Camp hinzugefügt werden
- **Lösung:** Blockieren mit Hinweis: "Max Müller ist bereits nominiert. Status ändern statt neu hinzufügen."

### EC-3: Athlet hat keine Email
- **Szenario:** Beim Email-Export hat ein Athlet keine Email-Adresse
- **Lösung:** Einfach auslassen, Hinweis: "3 Athleten haben keine Email-Adresse"

### EC-4: Camp-Datum in der Vergangenheit
- **Szenario:** User legt Camp für gestern an
- **Lösung:** Warnung: "Das Datum liegt in der Vergangenheit. Trotzdem fortfahren?"

### EC-5: Athlet löschen der in Camp ist
- **Szenario:** Athlet wird aus System gelöscht, war aber in Camp
- **Lösung:** Soft-Delete: Athlet bleibt in Camp sichtbar als "[Gelöscht]", aber auswärts nicht mehr verfügbar

## Abhängigkeiten
- PROJ-1: Athleten anlegen (für Athleten-Auswahl)

## MVP-Priorität
**🟡 NIEDRIG** - Post-MVP Feature

## Technische Hinweise (für Architect)
- Tabelle: `training_camps`
- Tabelle: `camp_participants` (Many-to-Many mit Status)
- Foreign Keys: participant → camp, participant → athlete
- Status als ENUM oder Integer (0=nominiert, 1=zugesagt, 2=abgesagt, 3=nachgerückt)

---

## Tech-Design (Solution Architect)

> **Hinweis:** Detaillierte Architektur-Dokumentation ist in `ARCHITECTURE.md` im Abschnitt "PROJ-5: Trainingscamps verwalten" zu finden.

### Component-Struktur (Übersicht)

```
Trainingscamps
├── CampList (Übersicht mit Filter)
├── CampForm (Anlegen/Bearbeiten)
├── CampDetail (Detail-Ansicht)
│   ├── CampParticipantList (Athleten gruppiert nach Status)
│   ├── NominationModal (Athleten hinzufügen)
│   └── EmailExportButtons (Email-Listen kopieren)
└── CapacityIndicator (Auslastungs-Anzeige)
```

### Daten-Model (vereinfacht)

**TrainingCamp (Haupt-Entität):**
- Name, Start-Datum, End-Datum (Pflicht)
- Status: geplant → aktiv → abgeschlossen
- Optional: Ort, Beschreibung, Kapazität, Kosten, Anmelde-Deadline

**CampParticipant (Verknüpfung):**
- Referenz zu Camp und Athlet
- Nominierungs-Status: vorgeschlagen/eingeladen/zugesagt/abgesagt/nachgerückt
- Optional: Kommentar (z.B. Absage-Grund)

### Daten-Flow (High-Level)

1. **Camp-Anlegen:** Formular → Validierung → Speicherung
2. **Athleten-Nominierung:** Autocomplete-Suche → Status-Vergabe → Speicherung
3. **Status-Änderung:** Dropdown → Prüfung (Kapazität/Logik) → Update
4. **Email-Export:** Filter nach Status → Emails sammeln → Zwischenablage

### Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Many-to-Many mit Status | Athleten haben unterschiedliche Status pro Camp |
| Status-Workflow | Spiegelt realen Nominierungs-Prozess wider |
| Live-Email-Export | Immer aktuelle Daten aus Athleten-DB |
| Duplizieren-Funktion | Effizienz für wiederkehrende Camps |

### Wiederverwendung

**Aus PROJ-1/2/3/4:**
- `useAthletes` Hook → Für Athleten-Suche
- `useTournaments` Pattern → Template für `useTrainingCamps`
- Modal-Struktur, Formular-Styling, Table-Layout
- Supabase + localStorage Fallback Pattern
- Autocomplete-Component (Athleten-Suche)

### Neue Dependencies

**Keine** - alles mit bestehendem Stack umsetzbar (React, Supabase, Tailwind).

### Edge Cases (Architektur)

| Case | Lösung |
|------|--------|
| Camp voll | Warn-Modal mit Option als Nachrücker |
| Doppelte Nominierung | Blockade mit Hinweis auf bestehenden Status |
| Athlet ohne Email | Überspringen beim Export, Toast mit Info |
| Überlappende Camps | Warnung, aber nicht blockieren |
| Athlet löschen | Soft-Delete, bleibt in Camp sichtbar |

### Status-Workflow

```
Vorgeschlagen → Eingeladen → Zugesagt
                     ↓
                Abgesagt → Nachgerückt → Zugesagt
```

### Integration

**Verknüpfungen:**
- Camp ↔ Athleten (via CampParticipant)
- Wiederverwendung der bestehenden Athleten-Datenbank
- Keine redundante Speicherung von Athleten-Daten
