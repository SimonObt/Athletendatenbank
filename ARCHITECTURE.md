# Athletendatenbank - Solution Architecture

## PROJ-5: Trainingscamps verwalten

---

## Component-Struktur

```
Trainingscamps (Hauptseite)
├── Camp-Übersicht
│   ├── Filter-Leiste (Status, Zeitraum, Suche)
│   ├── "Neues Camp" Button
│   └── Camp-Liste (kachel- oder tabellarisch)
│       ├── Camp-Karte/Zeile (klickbar)
│       │   ├── Name + Datum (von-bis)
│       │   ├── Ort
│       │   ├── Status-Badge (geplant/aktiv/abgeschlossen)
│       │   ├── Auslastung (X/Y Athleten)
│       │   └── Aktionen (Bearbeiten, Duplizieren, Löschen)
│       └── Leer-Zustand (wenn keine Camps)
├── Camp-Formular (Modal/Seite)
│   ├── Pflichtfelder: Name, Start-Datum, End-Datum
│   ├── Optionale Felder: Ort, Beschreibung, Kapazität, Kosten, Anmelde-Deadline
│   ├── Status-Auswahl (Standard: geplant)
│   └── Speichern/Abbrechen Buttons
└── Camp-Detail-Ansicht
    ├── Camp-Info (Header mit allen Details)
    ├── Statistik-Bereich
    │   ├── Anzahl pro Status (nominiert/zugesagt/abgesagt/nachgerückt)
    │   └── Auslastungs-Balken (wenn Kapazität gesetzt)
    ├── Athleten-Liste (gruppiert nach Status)
    │   ├── "Athlet hinzufügen" Button
    │   ├── Status-Gruppen (Tabs oder Accordion)
    │   │   └── Pro Athlet: Name, Verein, Status-Dropdown, Löschen-Button
    │   └── Leer-Zustand pro Gruppe
    ├── Nominierung-Modal
    │   ├── Athleten-Suche (Autocomplete aus bestehender DB)
    │   ├── Status-Vorauswahl (Standard: nominiert)
    │   ├── Mehrfach-Auswahl möglich
    │   └── Hinweis bei vollem Camp
    └── Email-Export-Bereich
        ├── Buttons: "Alle Emails", "Nur Zugesagte", "Nur Nominierte"
        └── Kopieren-in-Zwischenablage mit Bestätigung
```

---

## Daten-Model

### Trainingscamp (Haupt-Entität)
Jedes Camp speichert die Veranstaltungsdetails:
- **Eindeutige ID** (für Referenzierung)
- **Name** (z.B. "Winter-Trainingscamp 2024")
- **Zeitraum** (Start-Datum und End-Datum)
- **Status** (geplant → aktiv → abgeschlossen/abgesagt)
- **Ort** (optional, z.B. "Sportzentrum Köln")
- **Beschreibung** (optional, Details zum Camp)
- **Kapazität** (optional, max. Anzahl Athleten)
- **Kosten pro Person** (optional)
- **Anmelde-Deadline** (optional)
- **Erstellungszeitpunkt** und **Letzte Änderung**

**Speicherung:** In einer eigenen Tabelle mit allen obigen Feldern.

### Camp-Teilnehmer (Verknüpfungstabelle)
Jede Teilnehmer-Zuweisung speichert:
- **Referenz zum Camp** (welches Camp)
- **Referenz zum Athleten** (wer nimmt teil)
- **Nominierungs-Status** (vorgeschlagen/eingeladen/zugesagt/abgesagt/nachgerückt)
- **Kommentar** (optional, z.B. Absage-Grund)
- **Hinzugefügt am** (Zeitpunkt der Nominierung)
- **Status geändert am** (für Nachverfolgung)

**Wichtig:** Dies ist eine Many-to-Many Beziehung mit zusätzlichen Attributen (Status). Ein Athlet kann in vielen Camps sein, ein Camp hat viele Athleten.

### Athleten-Status im Camp
Die fünf Status sind als Workflow konzipiert:

| Status | Bedeutung | Farbe | Übergänge |
|--------|-----------|-------|-----------|
| **Vorgeschlagen** | Noch nicht kontaktiert | 🟡 Gelb | → Eingeladen |
| **Eingeladen** | Kontaktiert, wartet auf Antwort | 🔵 Blau | → Zugesagt / Abgesagt |
| **Zugesagt** | Nimmt teil | 🟢 Grün | → Abgesagt (Rücktritt) |
| **Abgesagt** | Kann nicht teilnehmen | 🔴 Rot | → Nachgerückt (neuer Athlet) |
| **Nachgerückt** | Ersatz für Abgesagten | 🟠 Orange | → Zugesagt |

---

## Daten-Flow

### Camp-Anlegen Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Camp-Anlegen                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Formular öffnen  │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Name     │   │ Datum    │   │ Optional │
        │ eingeben │   │ wählen   │   │ Felder   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌────────────────┐
                   │ Validierung    │
                   │ (Datum plausibel?│
                   │  Vergangenheit?) │
                   └───────┬────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │  OK      │              │ Warnung  │
        │          │              │ zeigen   │
        └────┬─────┘              └────┬─────┘
             │                         │
             └────────────┬────────────┘
                          ▼
                 ┌────────────────┐
                 │ Speichern      │
                 │ → Supabase/LS  │
                 └────────────────┘
```

### Athleten-Nominierung Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Athleten-Nominierung                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ "Hinzufügen"     │
                    │ Button klicken   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Modal öffnet     │
                    │ Autocomplete     │
                    │ (Athleten-DB)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Athlet   │   │ Mehrere  │   │ Suche    │
        │ wählen   │   │ wählen   │   │ filtern  │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌────────────────┐
                   │ Status wählen  │
                   │ (Standard:     │
                   │ nominiert)     │
                   └───────┬────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │ Prüfung:       │
                   │ Bereits im     │
                   │ Camp?          │
                   └───────┬────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │ JA       │              │ NEIN     │
        │ → Block  │              │ → Weiter │
        │ + Hinweis│              │          │
        └──────────┘              └────┬─────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │ Kapazität-     │
                              │ Prüfung (wenn  │
                              │ gesetzt)       │
                              └───────┬────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 ┌──────────┐                ┌──────────┐
                 │ Voll +   │                │ Platz    │
                 │ Zugesagt │                │ frei     │
                 │ → Warnung│                │          │
                 └────┬─────┘                └────┬─────┘
                      │                           │
                      └───────────┬───────────────┘
                                  ▼
                         ┌────────────────┐
                         │ Speichern      │
                         │ → Teilnehmer   │
                         │   anlegen      │
                         └────────────────┘
```

### Status-Workflow Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Status-Workflow                             │
└─────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │ Vorgeschlagen│
    │   (Start)   │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐     ┌─────────────┐
    │  Eingeladen  │────▶│  Zugesagt   │
    │  (Kontakt)   │     │   (Fix)     │
    └──────┬──────┘     └──────┬──────┘
           │                   │
           │                   │ (Rücktritt)
           ▼                   ▼
    ┌─────────────┐     ┌─────────────┐
    │  Abgesagt    │◄────│  (nach      │
    │  (Absage)    │     │   Absage)   │
    └──────┬──────┘     └─────────────┘
           │
           │ (Ersatz finden)
           ▼
    ┌─────────────┐
    │ Nachgerückt │────▶ Zugesagt
    │  (Ersatz)   │
    └─────────────┘

    Legende:
    ─────▶ Erlaubter Übergang
    ─ ─ ─▶ Möglicher Rückweg (Ausnahme)
```

### Email-Export Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       Email-Export                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│ "Alle Emails" │    │ "Zugesagte"    │    │ "Nominierte"   │
│    Button     │    │    Button      │    │    Button      │
└───────┬───────┘    └───────┬────────┘    └───────┬────────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Filter nach      │
                    │ gewähltem Status │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Email-Adressen   │
                    │ extrahieren      │
                    │ (athlete.email)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Leere Emails     │
                    │ herausfiltern    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Komma-separiert  │
                    │ in Zwischenablage│
                    │ kopieren         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Toast: "X       │
                    │ Adressen       │
                    │ kopiert"       │
                    └──────────────────┘
```

---

## Tech-Entscheidungen

### Warum Many-to-Many mit Status-Attribut?
→ Flexible Nominierungs-Workflows. Athleten durchlaufen verschiedene Phasen von "Interesse" bis "Fixe Zusage". Der Status erlaubt präzise Nachverfolgung und Email-Listen für unterschiedliche Zwecke.

### Warum separate Teilnehmer-Tabelle?
→ Datennormalisierung. Ein Athlet kann in vielen Camps sein, ein Camp hat viele Athleten. Die Verknüpfungstabelle hält zusätzliche Attribute (Status, Kommentar, Zeitstempel) die weder zum Athleten noch zum Camp allein gehören.

### Warum Status-Workflow statt einfacher Boolean?
→ Realitätsnähe. Einfache "An/Aus"-Logik reicht nicht:
- Landestrainer nominiert erst intern (vorgeschlagen)
- Dann offizielle Einladung (eingeladen)
- Athlet sagt zu oder ab (zugesagt/abgesagt)
- Bei Absage wird Ersatz benötigt (nachgerückt)

### Warum werden Emails live aus Athleten-DB geholt?
→ Aktualität. Wenn sich eine Email-Adresse ändert, wird automatisch die aktuelle Version verwendet. Keine Kopie in der Teilnehmer-Tabelle nötig.

### Warum Duplizieren-Funktion?
→ Effizienz. Viele Camps sind wiederkehrend ("Wintercamp 2024" → "Wintercamp 2025"). Duplizieren übernimmt alle Daten außer Datum und Status, spart Tipparbeit.

---

## Wiederverwendung aus PROJ-1 bis PROJ-4

### Bereits vorhandene Komponenten (wiederverwendbar)
| Komponente | Wiederverwendung für PROJ-5 |
|------------|---------------------------|
| `AthleteList` | ✅ Basis für Athleten-Suche in Nominierung |
| `DeleteConfirm` | ✅ Gleiches Muster für Camp-Löschung |
| Modal-Struktur | ✅ Gleiches Layout für Formulare |
| Formular-Input-Styling | ✅ Identische CSS-Klassen |
| Table-Layout | ✅ Gleiche Tabellen-Struktur für Camp-Liste |
| Badge-Styling | ✅ Für Status-Badges (wie Turnier-Status) |
| Autocomplete-Pattern | ✅ Aus Athleten-Suche übernehmen |
| Date-Picker | ✅ Bereits in Turnier-Formular genutzt |

### Bereits vorhandene Hooks/Patterns (wiederverwendbar)
| Pattern | Wiederverwendung |
|---------|-----------------|
| `useAthletes` | Für Athleten-Abfrage bei Nominierung |
| `useTournaments` | Template für `useTrainingCamps` |
| Supabase + localStorage Fallback | Identisch übernehmen |
| Error-Handling | Gleiches Try-Catch Muster |
| Loading-States | Gleiche isLoading Pattern |

### Bereits vorhandene API-Funktionen (Erweiterung)
| Funktion | Erweiterung für PROJ-5 |
|----------|----------------------|
| `supabase.ts` | Neue Funktionen für Camps/Teilnehmer hinzufügen |
| `types.ts` | Neue Interfaces für TrainingCamp, CampParticipant |

---

## Neue Komponenten (PROJ-5 spezifisch)

| Komponente | Zweck |
|------------|-------|
| `CampList` | Übersicht aller Camps mit Filter |
| `CampForm` | Formular für Camp-Anlage/Bearbeitung |
| `CampDetail` | Detail-Ansicht mit Teilnehmern |
| `CampParticipantList` | Liste der Athleten gruppiert nach Status |
| `NominationModal` | Athleten-Auswahl und -Hinzufügen |
| `StatusBadge` | Farbcodierte Status-Anzeige |
| `CapacityIndicator` | Visuelle Auslastungs-Anzeige |
| `EmailExportButtons` | Buttons für verschiedene Export-Filter |
| `DuplicateCampButton` | Duplizieren-Funktionalität |

---

## Dependencies

**Keine neuen Packages nötig!**

Alles wird mit bestehenden Tools umgesetzt:
- React Hooks (useState, useEffect, useCallback)
- Supabase Client (bereits installiert)
- Tailwind CSS (bereits installiert)
- Lucide Icons (bereits installiert)
- Date-Fns (bereits installiert für Datumsformatierung)

---

## Integration mit bestehenden Daten

### Verknüpfung Athlet ↔ Camp

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   Athlet    │◄────────│  Camp-Teilnehmer │────────►│    Camp     │
│  (PROJ-1)   │   1:N   │    (PROJ-5)      │   N:1   │  (PROJ-5)   │
└─────────────┘         └─────────────────┘         └─────────────┘
     │                           │
     │                           │
     ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ Athlet-Detail   │    │ Camp-Detail     │
│ - Camp-Historie │    │ - Teilnehmerliste│
│ - Teilnahmen    │    │ - Status-Statistik│
└─────────────────┘    └─────────────────┘
```

**1:N Beziehung Athlet → Camp-Teilnehmer:**
Ein Athlet kann in vielen Camps nominiert sein → viele Teilnehmer-Einträge

**N:1 Beziehung Camp-Teilnehmer → Camp:**
Viele Teilnehmer-Einträge gehören zu einem Camp

### Abfrage-Beispiele (Logisch beschrieben)

**"Alle Camps von Max Müller"**
1. Finde Athleten mit Name "Max Müller"
2. Suche alle Camp-Teilnehmer-Einträge dieses Athleten
3. Lade die zugehörigen Camp-Daten
4. Sortiere nach Camp-Datum (neueste zuerst)

**"Alle Zugesagten für Wintercamp 2024"**
1. Finde Camp mit Name "Wintercamp 2024"
2. Suche alle Teilnehmer-Einträge für dieses Camp
3. Filtere nach Status "zugesagt"
4. Lade Athleten-Daten für diese Einträge
5. Extrahiere Email-Adressen

---

## UI-Entwurf (Beschreibung)

### Camp-Liste
- **Header:** Titel + Filter-Leiste (Status-Dropdown, Datums-Range) + "Neues Camp" Button
- **Filter:** Status (geplant/aktiv/abgeschlossen), Zeitraum (von-bis), Suchfeld
- **Darstellung:** Kacheln oder Tabelle (je nach Nutzer-Präferenz)
- **Camp-Karte:**
  - Name fett, darunter Datum-Bereich
  - Ort als Subtext
  - Status-Badge (farbe entsprechend)
  - Auslastung als "12/20" oder Fortschrittsbalken
  - Aktionen: Bearbeiten (Icon), Duplizieren (Icon), Löschen (Icon)

### Camp-Formular
- **Zweispaltig:** Links Pflichtfelder, rechts Vorschau/Optionale Felder
- **Datum:** Zwei Date-Picker (von-bis) mit Validierung (Ende nach Start)
- **Kapazität:** Number-Input mit Hinweis "0 = unbegrenzt"
- **Warnung:** Wenn Datum in Vergangenheit liegt

### Camp-Detail-Ansicht
- **Header:** Camp-Name prominent, darunter Datum + Ort
- **Statistik-Karten:** 4 Karten in einer Reihe (Nominiert/Eingeladen/Zugesagt/Abgesagt)
- **Auslastungs-Balken:** Falls Kapazität gesetzt, grüner/ gelber/ roter Balken
- **Tabs oder Accordion:** Status-Gruppen als ausklappbare Bereiche
- **Athleten-Zeile:** Avatar (Initialen) + Name + Verein + Status-Dropdown + Löschen-Icon

### Nominierung-Modal
- **Athleten-Suche:** Autocomplete mit Suggestion-Liste
- **Mehrfachauswahl:** Checkboxen oder "hinzufügen" pro Zeile
- **Status-Dropdown:** Vorauswahl vor dem Speichern
- **Hinweis-Box:** "Camp ist fast voll" oder "X Plätze noch frei"

### Email-Export
- **Button-Gruppe:** 3-4 Buttons nebeneinander
- **Toast-Benachrichtigung:** "5 Email-Adressen kopiert" (verschwindet nach 3 Sek.)
- **Warnung:** Wenn Athleten keine Email haben → "3 Athleten ohne Email übersprungen"

---

## Edge Cases (Architektur-Lösungen)

| Edge Case | Architektur-Lösung |
|-----------|-------------------|
| **EC-1: Camp ist voll** | Bei Hinzufügen: Prüfung `zugesagt_count >= capacity`. Falls ja: Warn-Modal "Camp ist voll. Trotzdem als Nachrücker hinzufügen?" |
| **EC-2: Athlet mehrfach hinzufügen** | Datenbank-Constraint oder Prüfung vor Insert. Fehler: "Max Müller ist bereits im Camp (Status: zugesagt)" |
| **EC-3: Athlet hat keine Email** | Beim Export: Einfach überspringen, Toast zeigt "3 von 5 Athleten haben keine Email" |
| **EC-4: Camp-Datum in der Vergangenheit** | Warnung beim Speichern: "Das Camp liegt in der Vergangenheit. Trotzdem anlegen?" → Ja/Nein |
| **EC-5: Athlet löschen der in Camp ist** | Soft-Delete: Athlet bleibt in Camp sichtbar als "[Gelöscht]", aber nicht mehr in Auswahl für neue Camps |
| **EC-6: Überlappende Camps** | Hinweis beim Nominieren: "Max Müller ist im gleichen Zeitraum bereits im Camp Y nominiert" (Warnung, nicht Blockade) |
| **EC-7: Alle zugesagt, dann Absage** | Status-Änderung erlaubt, aber Warnung: "Camp wäre dadurch unterbelegt. Ersatz einplanen?" |
| **EC-8: Camp duplizieren mit vergangenem Datum** | Beim Duplizieren: Datum-Felder leeren, User muss neu eingeben |
| **EC-9: Offline-Modus** | Camps und Teilnehmer in localStorage speichern, Sync bei Verbindung (wie bei Athleten/Turnieren) |
| **EC-10: Gleicher Athlet in mehreren Status** | Technisch unmöglich durch DB-Constraint. UI verhindert durch Prüfung vor Nominierung. |

---

## Zusammenfassung für Product Manager

**Was wird gebaut?**
Ein Trainingscamp-Verwaltungssystem mit fünf Hauptfunktionen:
1. **Camp-Verwaltung:** Anlegen, bearbeiten, duplizieren von Camps mit Details wie Datum, Ort, Kapazität
2. **Athleten-Nominierung:** Auswahl aus bestehender Athleten-Datenbank mit Status-Tracking
3. **Status-Workflow:** Vom Vorschlag über Einladung bis zur finalen Zusage (oder Absage)
4. **Email-Export:** Einfaches Kopieren von Email-Adressen für Mail-Verteiler nach Status gefiltert
5. **Übersichten:** Auslastung, Statistiken, Filter nach Status und Zeitraum

**Wie funktioniert es?**
- Landestrainer legt ein neues Camp an (z.B. "Wintercamp 2025")
- Er nominiert Athleten aus der bestehenden Datenbank
- Jeder Athlet durchläuft den Workflow: Vorgeschlagen → Eingeladen → Zugesagt/Abgesagt
- Bei Absagen werden Ersatz-Athleten (Nachrücker) eingeladen
- Für Einladungen werden Email-Listen per Kopieren-andere-Taste erstellt
- Das Camp kann dupliziert werden für wiederkehrende Veranstaltungen

**Was ist das Besondere?**
- **Integrierter Workflow:** Keine externe Tabellen oder Listen mehr nötig
- **Flexible Status:** Reproduziert den realen Nominierungs-Prozess
- **Smarte Warnungen:** Überbuchung, doppelte Nominierung, fehlende Emails werden erkannt
- **Einfacher Export:** Email-Listen mit einem Klick kopieren
- **Vollständige Nachvollziehbarkeit:** Wer wurde wann in welchem Status eingeladen?

**Keine neuen Technologien nötig** - alles mit bestehendem Stack (React, Supabase, Tailwind) umsetzbar.

---

## PROJ-3: Turnierergebnisse importieren & Punktesystem

---

## Component-Struktur

```
Turnierergebnisse (Hauptseite)
├── Turnier-Auswahl
│   ├── Dropdown: Abgeschlossene Turniere
│   └── Info-Box: Gewähltes Turnier + Punktesystem
├── Import-Bereich
│   ├── CSV-Upload (wiederverwendet aus PROJ-1)
│   ├── Import-Vorschau
│   │   ├── Athleten-Liste mit Matching-Status
│   │   │   ├── ✅ Gefunden (grün)
│   │   │   ├── ⚠️ Unbekannt (rot) → "Neu anlegen" / "Überspringen"
│   │   │   └── 🔗 Ähnlich gefunden (gelb) → "Verknüpfen" Option
│   │   └── Ungültige Platzierungen Warnung
│   └── Zusammenfassung vor Import
├── Ergebnis-Liste (pro Turnier)
│   ├── Filter: Altersklasse, Geschlecht
│   ├── Tabelle: Platzierung | Athlet | Verein | Punkte
│   ├── Bearbeiten-Button (pro Zeile)
│   └── Löschen-Button (mit Bestätigung)
├── Manuelles Hinzufügen (Modal)
│   ├── Athleten-Suche (Autocomplete)
│   ├── Platzierung-Dropdown (1, 2, 3, 5, 7)
│   ├── Punkte-Vorschau (automatisch berechnet)
│   └── Speichern/Abbrechen
└── Punkte-Übersicht (Athleten-Detailseite)
    ├── Gesamtpunktzahl (prominent)
    ├── Jahres-Filter
    └── Turnier-Historie (Chronologisch)
```

---

## Daten-Model

### Turnierergebnis (Kern-Entität)
Jedes Ergebnis verknüpft Athlet, Turnier und Leistung:
- **Eindeutige ID** (für Änderungshistorie)
- **Referenz zum Turnier** (welches Turnier)
- **Referenz zum Athleten** (wer hat teilgenommen)
- **Platzierung** (1, 2, 3, 5 oder 7 - Judo-Standard)
- **Erhaltene Punkte** (kopiert aus Turnier zum Zeitpunkt des Imports)
- **Import-Methode** (CSV oder manuell)
- **Import-Zeitpunkt** (für Chronologie)
- **Letzte Änderung** (wer hat wann was geändert)

**Wichtig:** Punkte werden kopiert, nicht berechnet live! So bleiben historische Ergebnisse korrekt, auch wenn sich das Turnier-Level später ändert.

### CSV-Ergebnis ( temporär beim Import)
Während des Imports werden CSV-Zeilen temporär als Objekte gehalten:
- Name (zum Matchen mit Athleten)
- Verein (optional, hilft beim Matchen)
- Jahrgang (optional, hilft beim Matchen)
- Platzierung
- Matching-Status (gefunden / unbekannt / ähnlich)

---

## Daten-Flow

### CSV-Import Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       CSV-Import Prozess                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│  CSV-Upload    │    │  Fuzzy-Matching │    │  Vorschau      │
│  (PapaParse)   │───▶│  (Athleten-DB)  │───▶│  & Konflikte   │
└───────────────┘    └────────────────┘    └───────┬────────┘
                                                   │
                              ┌────────────────────┼────────────────────┐
                              ▼                    ▼                    ▼
                        ┌──────────┐        ┌──────────┐        ┌──────────┐
                        │ Gefunden │        │ Ähnlich  │        │ Unbekannt│
                        │   ✅     │        │   🔗     │        │   ❓     │
                        └────┬─────┘        └────┬─────┘        └────┬─────┘
                             │                   │                   │
                             ▼                   ▼                   ▼
                        Direkt         Verknüpfen mit        Neu anlegen
                        importieren    bestehendem           oder überspringen
                                       Athleten
```

### Punkte-Berechnung Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Punkte-Berechnung                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Turnier gewählt  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Punkte aus       │
                    │ Turnier-Record   │
                    │ (nicht Level!)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │Platz 1   │   │Platz 2   │   │Platz 3   │
        │10 Punkte │   │7 Punkte  │   │5 Punkte  │
        └──────────┘   └──────────┘   └──────────┘
```

### Rangliste-Generierung Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rangliste-Generierung                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│ Altersklasse  │    │  Geschlecht    │    │  Jahr          │
│ Filter        │    │  Filter        │    │  Filter        │
└───────┬───────┘    └───────┬────────┘    └───────┬────────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             ▼
                    ┌────────────────┐
                    │ Ergebnisse     │
                    │ filtern        │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Punkte pro     │
                    │ Athlet summieren│
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Nach Punkten   │
                    │ sortieren      │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Rangliste      │
                    │ anzeigen       │
                    └────────────────┘
```

---

## Tech-Entscheidungen

### Warum Fuzzy-Matching für Athleten-Namen?
→ CSV-Dateien haben oft Tippfehler oder andere Schreibweisen ("Müller" vs "Mueller", "Max" vs "Maximilian"). Das System nutzt einen Ähnlichkeits-Algorithmus (z.B. Levenshtein-Distanz) und schlägt Treffer vor, statt strikt zu matchen.

### Warum werden Punkte kopiert statt berechnet?
→ Historische Korrektheit. Wenn sich das Punktesystem für ein Turnier-Level nachträglich ändert, sollen bereits importierte Ergebnisse ihre ursprünglichen Punkte behalten. Neue Ergebnisse bekommen automatisch die neuen Punkte.

### Warum nur Platzierungen 1, 2, 3, 5, 7?
→ Judo-Regeln. Im Judo gibt es keine 4. und 6. Plätze (diese kämpfen um Bronze). Das System validiert dies und warnt bei ungültigen Platzierungen.

### Warum Import-ID vs Name-Matching?
→ Flexibilität. Für bekannte Athleten (die bereits in der Datenbank sind) kann die Import-ID (Nachname_Vorname_Jahrgang) verwendet werden. Für unbekannte oder bei CSV-Dateien ohne ID wird Fuzzy-Matching auf Name + Jahrgang genutzt.

### Waron "Manuell hinzugefügt" Flag?
→ Transparenz. So kann später unterschieden werden zwischen Massen-Import (CSV) und Einzelkorrekturen. Hilfreich für Auditing.

---

## Wiederverwendung aus PROJ-1 und PROJ-2

### Bereits vorhandene Komponenten (wiederverwendbar)
| Komponente | Wiederverwendung für PROJ-3 |
|------------|---------------------------|
| `CsvImport` | ✅ Basis für CSV-Import, erweitert um Platzierung-Spalte |
| `DeleteConfirm` | ✅ Gleiches Muster für Ergebnis-Löschung |
| Modal-Struktur | ✅ Gleiches Layout für manuelles Hinzufügen |
| Formular-Input-Styling | ✅ Identische CSS-Klassen |
| Table-Layout | ✅ Gleiche Tabellen-Struktur für Ergebnis-Liste |
| `AthleteList` Filter | ✅ Filter-Pattern für Altersklasse/Geschlecht |

### Bereits vorhandene Hooks/Patterns (wiederverwendbar)
| Pattern | Wiederverwendung |
|---------|-----------------|
| `useAthletes` | Für Athleten-Suche und Matching |
| `useTournaments` | Für Turnier-Auswahl und Punkte-Lookup |
| Supabase + localStorage Fallback | Identisch übernehmen |
| `generateImportId` | Für Athleten-Matching in CSV |
| PapaParse CSV-Parsing | Bereits in PROJ-1 etabliert |

### Neue Komponenten (PROJ-3 spezifisch)
| Komponente | Zweck |
|------------|-------|
| `ResultCsvImport` | Erweitert `CsvImport` um Platzierungs-Logik |
| `FuzzyMatchDialog` | Zeigt ähnliche Athleten zur Auswahl |
| `ResultTable` | Liste aller Ergebnisse pro Turnier |
| `ManualResultForm` | Formular für manuelle Eingabe |
| `PointsCalculator` | Zeigt Punkte-Vorschau |
| `RankingList` | Ranglisten-Anzeige mit Filter |

---

## Dependencies

**Keine neuen Packages nötig!**

Alles wird mit bestehenden Tools umgesetzt:
- React Hooks (useState, useEffect, useCallback)
- Supabase Client (bereits installiert)
- Tailwind CSS (bereits installiert)
- Lucide Icons (bereits installiert)
- PapaParse (bereits für PROJ-1 installiert)

**Optional für Fuzzy-Matching:**
- `fuse.js` oder `fast-levenshtein` für bessere String-Vergleiche (kann auch ohne Library mit einfachem Algorithmus gelöst werden)

---

## Integration mit bestehenden Daten

### Verknüpfung Athlet ↔ Ergebnis ↔ Turnier

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   Athlet    │◄────────│ Turnierergebnis │────────►│   Turnier   │
│  (PROJ-1)   │   1:N   │    (PROJ-3)     │   N:1   │  (PROJ-2)   │
└─────────────┘         └─────────────────┘         └─────────────┘
     │                           │
     │                           │
     ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ Athlet-Detail   │    │ Turnier-Detail  │
│ - Punkte-Total  │    │ - Ergebnisliste │
│ - Turnierhistorie│   │ - Punktesystem  │
└─────────────────┘    └─────────────────┘
```

**1:N Beziehung Athlet → Ergebnisse:**
Ein Athlet kann an vielen Turnieren teilnehmen → viele Ergebnisse

**N:1 Beziehung Ergebnis → Turnier:**
Viele Ergebnisse gehören zu einem Turnier

### Abfrage-Beispiele (Logisch beschrieben)

**"Alle Punkte von Max Müller 2024"**
1. Finde Athleten mit Name "Max Müller"
2. Suche alle Ergebnisse dieses Athleten
3. Filtere nach Jahr 2024
4. Summiere die Punkte-Spalte

**"Rangliste U15 männlich 2024"**
1. Suche alle Turniere 2024
2. Finde alle Ergebnisse dieser Turniere
3. Filtere nach Altersklasse U15 und Geschlecht männlich
4. Gruppiere nach Athlet
5. Summiere Punkte pro Athlet
6. Sortiere absteigend nach Punkten

---

## UI-Entwurf (Beschreibung)

### Turnierergebnisse-Seite
- **Header:** Turnier-Auswahl-Dropdown (nur abgeschlossene Turniere)
- **Info-Box:** Anzeige des gewählten Turniers mit Datum, Ort und Punktesystem
- **Tabs:** "Importieren" | "Ergebnisse" | "Rangliste"

### CSV-Import Tab
- **Upload-Bereich:** Drag & Drop oder Datei-Auswahl
- **Vorschau-Tabelle:**
  - Zeilen: CSV-Zeilen
  - Spalten: Name | Verein | Jahrgang | Platzierung | Status | Aktion
  - Status: Grüner Haken (gefunden) / Gelbes Warn-Icon (ähnlich) / Rotes X (unbekannt)
  - Aktion: "Verknüpfen" Dropdown bei ähnlichen / "Neu anlegen" Button bei unbekannten
- **Zusammenfassung:** X Athleten gefunden | Y neu | Z unbekannt
- **Import-Button:** Aktiv erst nach Konflikt-Lösung

### Ergebnisse Tab
- **Filter-Bar:** Altersklasse-Dropdown | Geschlecht-Dropdown | Suchfeld
- **Ergebnis-Tabelle:**
  - Sortierbar nach Platzierung (Standard) oder Name
  - Spalten: Platzierung | Name | Verein | Jahrgang | Punkte | Aktionen
  - Aktionen: Bearbeiten (Icon) | Löschen (Icon)
- **"Manuell hinzufügen" Button:** Öffnet Modal

### Manuelles Hinzufügen Modal
- **Athleten-Suche:** Autocomplete-Input mit Namen
- **Platzierung:** Dropdown (1, 2, 3, 5, 7)
- **Punkte-Vorschau:** Sofort angezeigt nach Platzierung-Wahl
- **Speichern:** Button aktiv wenn alle Felder gefüllt

### Athleten-Detailseite (Erweiterung)
- **Punkte-Karte:** Groß angezeigt: "245 Punkte 2024"
- **Jahres-Filter:** Dropdown für vergangene Jahre
- **Turnier-Historie Tabelle:**
  - Spalten: Datum | Turnier | Platzierung | Punkte
  - Sortierung: Chronologisch (neueste zuerst)

### Rangliste Tab
- **Filter-Bar:** Altersklasse | Geschlecht | Jahr
- **Rangliste-Tabelle:**
  - Spalten: Rang | Name | Verein | Punkte | Turniere
  - Rang: 1., 2., 3. mit Medaillen-Icon (Gold/Silber/Bronze)
  - Highlight: Top 3 mit farblicher Hinterlegung

---

## Edge Cases (Architektur-Lösungen)

| Edge Case | Architektur-Lösung |
|-----------|-------------------|
| **EC-1: Athlet bereits mit Ergebnis** | Beim Import: Warnung "Max Müller hat bereits Platz 3 (5 Punkte). Überschreiben mit Platz 1 (10 Punkte)?" → Ja/Nein pro Athlet |
| **EC-2: Ungültige Platzierung (4, 6)** | Validierung vor Import: Gelbe Warnung in Vorschau, Import-Button deaktiviert bis behoben |
| **EC-3: Athlet ändert sich nach Import** | Ergebnis speichert Athleten-ID, nicht Name. Name-Änderung wirkt sich auf alle Ergebnisse aus. |
| **EC-4: Turnier-Level ändert sich** | Punkte wurden beim Import kopiert → historische Ergebnisse bleiben unverändert. Dialog: "Sollen X Ergebnisse neu berechnet werden?" für Korrektur. |
| **EC-5: CSV mit falschem Jahrgang** | Vorschau zeigt Konflikt: "CSV: 2008 | System: 2009" → Buttons: "CSV nutzen" / "System nutzen" / "Überspringen" |
| **EC-6: CSV mit unbekanntem Verein** | Optionaler Hinweis: "Verein 'XYZ' nicht bekannt. Trotzdem importieren?" → Athlet wird mit neuem Verein angelegt |
| **EC-7: Löschen eines Ergebnisses** | Bestätigungsdialog + Änderung wird in Historie geloggt. Punkte werden vom Athleten abgezogen. |
| **EC-8: Leere CSV** | Fehlermeldung: "Keine gültigen Daten gefunden. Bitte prüfe das CSV-Format." |
| **EC-9: Offline-Modus** | Ergebnisse werden in localStorage gespeichert, Sync bei Verbindung (wie bei Athleten/Turnieren) |

---

## Zusammenfassung für Product Manager

**Was wird gebaut?**
Ein System zum Importieren und Verwalten von Turnierergebnissen mit automatischer Punktevergabe:
1. **CSV-Import:** Massen-Import von Ergebnissen mit intelligenter Athleten-Erkennung
2. **Manuelle Eingabe:** Einzelne Ergebnisse nachtragen oder korrigieren
3. **Punkte-Verwaltung:** Automatische Berechnung basierend auf Turnier-Level
4. **Ranglisten:** Übersicht über die besten Athleten nach Altersklasse/Geschlecht

**Wie funktioniert es?**
- Landestrainer wählt ein abgeschlossenes Turnier aus
- Lädt CSV mit Ergebnissen hoch (oder trägt manuell ein)
- System erkennt Athleten automatisch (Fuzzy-Matching)
- Bei unbekannten Athleten: Option zum Anlegen oder Überspringen
- Punkte werden automatisch aus dem Turnier-Level übernommen
- Ranglisten werden live aus allen Ergebnissen berechnet

**Was ist das Besondere?**
- **Fuzzy-Matching:** Findet Athleten auch bei Tippfehlern oder Namensvariationen
- **Flexible CSV-Formate:** Unterstützt verschiedene CSV-Strukturen
- **Historische Korrektheit:** Punkte werden kopiert, bleiben also erhalten wenn sich das System ändert
- **Vollständige Nachvollziehbarkeit:** Jede Änderung wird protokolliert

**Keine neuen Technologien nötig** - alles mit bestehendem Stack (React, Supabase, Tailwind) umsetzbar.

---

## PROJ-2: Turniere anlegen & verwalten

---

## Component-Struktur

```
Turnier-Verwaltung (Hauptseite)
├── Turnier-Liste
│   ├── Suchleiste (nach Name/Ort)
│   ├── Filter (Status, Turnier-Level, Altersklasse)
│   ├── "Neues Turnier" Button
│   └── Turnier-Tabelle
│       ├── Turnier-Zeile (klickbar zum Bearbeiten)
│       │   ├── Name + Datum
│       │   ├── Level-Badge (farbcodiert)
│       │   ├── Status (geplant/abgeschlossen)
│       │   └── Aktionen (Bearbeiten, Abschließen, Löschen)
│       └── Leer-Zustand (wenn keine Turniere)
├── Turnier-Formular (Modal)
│   ├── Pflichtfelder: Name, Level-Dropdown, Datum
│   ├── Optionale Felder: Ort, Beschreibung, Altersklasse
│   ├── Punkte-Vorschau (basierend auf gewähltem Level)
│   └── Speichern/Abbrechen Buttons
├── Turnier-Level-Verwaltung (Modal/Seite)
│   ├── Level-Liste mit Punktewerten
│   │   └── Pro Zeile: Name + 5 Platzierungen mit Punkten
│   ├── "Neues Level" Button
│   ├── Level-Editor (Inline oder Modal)
│   └── Löschen-Button (mit Warnung)
└── Löschen-Bestätigung (Modal)
    └── Warnung bei existierenden Turnieren mit diesem Level
```

---

## Daten-Model

### Turnier-Level (Vorlage)
Jedes Turnier-Level definiert das Punktesystem:
- Eindeutiger Name (z.B. "LET U14", "BEM U11")
- Punkte für Platz 1
- Punkte für Platz 2
- Punkte für Platz 3
- Punkte für Platz 5
- Punkte für Platz 7

**Speicherung:** In einer eigenen Tabelle als "Vorlagen" für Turniere.

### Turnier (Konkrete Veranstaltung)
Jedes Turnier speichert:
- Eindeutige ID
- Name (z.B. "LET Köln 2024")
- Verknüpfung zu einem Turnier-Level
- Datum
- Ort (optional)
- Beschreibung (optional)
- Altersklasse (optional, z.B. U11, U13, U15)
- Status (geplant oder abgeschlossen)
- Erstellungszeitpunkt

**Wichtig:** Die Punktewerte werden beim Anlegen vom Level kopiert, können aber pro Turnier angepasst werden. So bleiben alte Turniere unverändert, auch wenn sich das Level ändert.

---

## Daten-Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Turnier-Verwaltung                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│  Turnier-Liste │    │ Turnier-Formular│    │ Level-Manager  │
└───────┬───────┘    └───────┬────────┘    └───────┬────────┘
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             ▼
                    ┌────────────────┐
                    │ useTournaments │
                    │     Hook       │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌──────────┐   ┌──────────┐
        │Supabase │   │localStorage│   │  Cache   │
        │(online) │   │ (offline)  │   │ (React)  │
        └─────────┘   └──────────┘   └──────────┘
```

**Ablauf beim Anlegen eines Turniers:**
1. User öffnet "Neues Turnier" Formular
2. Wählt ein Turnier-Level aus Dropdown
3. Punkte-Vorschau wird automatisch aus dem Level geladen
4. User gibt Name, Datum etc. ein
5. Beim Speichern: Punkte werden kopiert, nicht referenziert

**Ablauf beim Ändern eines Levels:**
1. User öffnet Level-Verwaltung
2. Bearbeitet Punktewerte
3. System prüft: Gibt es bereits Turniere mit diesem Level?
4. Falls ja: Warnung + Option, bestehende Turniere neu zu berechnen

---

## Tech-Entscheidungen

### Warum separate Tabelle für Turnier-Level?
→ Wiederverwendbare Vorlagen. Der Landestrainer definiert einmal "LET U14 = 8/6/4/2/1 Punkte" und kann dieses Level für alle LET-Turniere verwenden.

### Warum werden Punkte kopiert statt referenziert?
→ Historische Korrektheit. Wenn sich das Punktesystem für "LET U14" im nächsten Jahr ändert, bleiben alte Turniere mit dem alten System erhalten.

### Warum kein echtes "Delete" für Levels mit Turnieren?
→ Datenintegrität. Stattdessen: Löschen verhindern mit klarem Hinweis, welche Turniere betroffen sind.

### Warum Status "geplant" vs "abgeschlossen"?
→ Flexibilität. Geplante Turniere können noch bearbeitet werden (z.B. Datum verschieben). Abgeschlossene sind gesperrt für Ergebnis-Eintragung (kommt in PROJ-3).

---

## Wiederverwendung aus PROJ-1

### Bereits vorhandene Komponenten (wiederverwendbar)
| Komponente | Wiederverwendung für PROJ-2 |
|------------|---------------------------|
| `DeleteConfirm` | Ja - gleiches Muster für Turnier-Löschung |
| Modal-Struktur | Ja - gleiches Layout für Formulare |
| Formular-Input-Styling | Ja - identische CSS-Klassen |
| Table-Layout | Ja - gleiche Tabellen-Struktur |
| Badge-Styling | Ja - für Level-Status-Badges |

### Bereits vorhandene Hooks/Patterns (wiederverwendbar)
| Pattern | Wiederverwendung |
|---------|-----------------|
| `useAthletes` Struktur | Template für `useTournaments` |
| Supabase + localStorage Fallback | Identisch übernehmen |
| Error-Handling | Gleiches Try-Catch Muster |
| Loading-States | Gleiche isLoading Pattern |

### Bereits vorhandene API-Funktionen (Erweiterung)
| Funktion | Erweiterung für PROJ-2 |
|----------|----------------------|
| `supabase.ts` | Neue Funktionen für Turniere/Levels hinzufügen |
| `types.ts` | Neue Interfaces für Tournament, TournamentLevel |

---

## Neue Dependencies

**Keine neuen Packages nötig!**

Alles wird mit bestehenden Tools umgesetzt:
- React Hooks (useState, useEffect, useCallback)
- Supabase Client (bereits installiert)
- Tailwind CSS (bereits installiert)
- Lucide Icons (bereits installiert)

---

## Integration mit bestehenden Athleten-Daten

### Vorbereitung für PROJ-3 (Rangliste)
In PROJ-3 werden Turnier-Ergebnisse Athleten zugeordnet:

```
Turnier-Ergebnis (zukünftig in PROJ-3)
├── Referenz zu Athlet (aus PROJ-1)
├── Referenz zu Turnier (aus PROJ-2)
├── Platzierung (1, 2, 3, 5, 7)
└── Punkte (aus Turnier kopiert)
```

Diese Architektur ermöglicht später:
- "Wie viele Punkte hat Athlet X in diesem Jahr?"
- "Welche Turniere hat Athlet X gewonnen?"
- Ranglisten-Berechnung nach Altersklasse/Geschlecht

---

## UI-Entwurf (Beschreibung)

### Turnier-Liste
- **Header:** Titel + Filter-Leiste + "Neues Turnier" Button
- **Filter:** Dropdown für Status, Dropdown für Level, Suchfeld
- **Tabelle:** Chronologisch sortiert (neueste zuerst)
- **Zeilen:** Name fett, darunter Datum/Ort in Grau
- **Badges:** Level als farbige Tags (z.B. LET = blau, BEM = grün)
- **Status:** Kleines Icon für geplant/abgeschlossen

### Turnier-Formular
- **Zweispaltig:** Links Pflichtfelder, rechts Vorschau der Punkte
- **Level-Dropdown:** Lädt Punkte automatisch nach Auswahl
- **Punkte-Vorschau:** 5 Felder (Platz 1-3, 5, 7) mit Werten aus Level
- **Editable:** User kann Punkte direkt im Formular anpassen

### Level-Manager
- **Kompakte Tabelle:** Name + 5 Zahlen-Spalten
- **Inline-Edit:** Klick auf Zeile öffnet Editor
- **Warn-Icon:** Bei Levels die in Turnieren verwendet werden

---

## Edge Cases (Architektur-Lösungen)

| Edge Case | Architektur-Lösung |
|-----------|-------------------|
| Level löschen mit Turnieren | Datenbank-Constraint verhindert Löschen → UI zeigt Hinweis |
| Gleiches Turnier 2x (Name+Datum) | Erlaubt, aber Warn-Badge in Liste (unterschiedliche Altersklassen möglich) |
| Level-Punkte ändern nach Ergebnissen | Dialog: "X Ergebnisse neu berechnen?" → Batch-Update oder ignorieren |
| Offline-Modus | localStorage-Fallback wie bei Athleten → Sync bei Verbindung |

---

## Zusammenfassung für Product Manager

**Was wird gebaut?**
Ein Turnier-Verwaltungssystem mit zwei Ebenen:
1. **Turnier-Level:** Vorlagen mit Punktesystem (einmal definieren, oft verwenden)
2. **Turniere:** Konkrete Veranstaltungen mit Kopie der Punkte

**Wie funktioniert es?**
- Landestrainer legt Levels an (z.B. "LET U14" mit 8/6/4/2/1 Punkten)
- Beim Turnier-Anlegen wird das Level gewählt → Punkte werden übernommen
- Turniere können bearbeitet werden (bis sie abgeschlossen sind)
- Levels können nicht gelöscht werden, wenn sie verwendet werden

**Was ist das Besondere?**
- Punkte werden kopiert, nicht referenziert → Historische Korrektheit
- Flexibles System für verschiedene Altersklassen und Turnier-Typen
- Vorbereitung für zukünftige Ranglisten-Funktion

**Keine neuen Technologien nötig** - alles mit bestehendem Stack (React, Supabase, Tailwind) umsetzbar.
