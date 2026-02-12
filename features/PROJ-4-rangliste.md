# PROJ-4: Rangliste mit Filterfunktion

## Status: ✅ Done

## Beschreibung
Eine Rangliste aller Athleten, sortiert nach Punkten, mit vielfältigen Filtermöglichkeiten.

## User Stories

- Als Landestrainer möchte ich eine Rangliste aller Athleten sehen, sortiert nach Gesamtpunkten
- Als Landestrainer möchte ich die Rangliste nach Jahrgang filtern können
- Als Landestrainer möchte ich die Rangliste nach Geschlecht filtern können
- Als Landestrainer möchte ich die Rangliste nach Jahr filtern können (z.B. nur Punkte aus 2024)
- Als Landestrainer möchte ich die Rangliste nach Turnier filtern können (z.B. nur LET-U15-Turniere)
- Als Landestrainer möchte ich mehrere Filter kombinieren können (z.B. weiblich + U15 + 2024)
- Als Landestrainer möchte ich die Rangliste als CSV oder PDF exportieren können
- Als Landestrainer möchte ich sehen, wie sich die Punktzahl eines Athleten über das Jahr entwickelt hat
- Als Landestrainer möchte ich die Top 10, Top 50 oder alle Athleten anzeigen können

## Filter-Optionen

### Pflicht-Filter (immer verfügbar)
- [ ] **Jahrgang:** Mehrfachauswahl (2008, 2009, 2010, ...) oder Range (2008-2010)
- [ ] **Geschlecht:** Mehrfachauswahl (männlich, weiblich, divers)

### Zeit-Filter
- [ ] **Jahr:** Dropdown (2023, 2024, 2025, ...) → zeigt nur Punkte aus diesem Jahr
- [ ] **Zeitraum:** Von/Bis Datum (optional statt Jahr)
- [ ] **Alle Zeit:** Kein Zeit-Filter (Gesamtpunkte aller Zeiten)

### Turnier-Filter
- [ ] **Turnier-Level:** Mehrfachauswahl (LET, BEM, LEM, WdEM, International)
- [ ] **Spezifisches Turnier:** Dropdown mit allen Turnieren
- [ ] **Altersklasse:** U11, U13, U15, U18 (wird aus Turnier-Daten abgeleitet)

### Kombinierte Filter
- [ ] Filter können kombiniert werden (AND-Logik)
- [ ] Es gibt einen "Filter zurücksetzen" Button
- [ ] Aktive Filter werden als "Tags" angezeigt (zum einzelnen Entfernen)

## Ranglisten-Ansicht

### Standard-Ansicht (Tabelle)
| Rang | Name | Verein | Jahrgang | Geschlecht | Punkte | Turniere |
|------|------|--------|----------|------------|--------|----------|
| 1 | Max Müller | JC Köln | 2008 | m | 245 | 8 |
| 2 | Anna Schmidt | JC Düsseldorf | 2009 | w | 198 | 6 |
| ... | ... | ... | ... | ... | ... | ... |

### Spalten
- [ ] Rang (1, 2, 3, ...)
- [ ] Name (Vorname Nachname)
- [ ] Verein
- [ ] Jahrgang
- [ ] Geschlecht
- [ ] Punkte (Summe der gefilterten Punkte)
- [ ] Anzahl Turniere (wie viele Ergebnisse liegen vor)

### Sortierung
- [ ] Standard: Nach Punkten absteigend
- [ ] Klick auf Spaltenkopf sortiert nach dieser Spalte
- [ ] Zweiter Klick kehrt Sortierung um

## Detail-Ansicht pro Athlet

Wenn ich auf einen Athleten klicke:
- [ ] Alle Turnierergebnisse mit Punkten
- [ ] Chronologische Liste der Teilnahmen
- [ ] Diagramm: Punkte-Entwicklung über Zeit
- [ ] Durchschnittliche Platzierung
- [ ] Beste Platzierung

## Acceptance Criteria

### Rangliste anzeigen
- [ ] Ich öffne die Rangliste und sehe alle Athleten sortiert nach Punkten
- [ ] Die Liste lädt schnell (< 2 Sekunden auch bei 500+ Athleten)
- [ ] Ich sehe meine aktiven Filter oben als Tags
- [ ] Ich kann auf einen Athleten klicken für Details

### Filter anwenden
- [ ] Ich wähle Jahrgang 2008 und 2009 → Liste zeigt nur diese Jahrgänge
- [ ] Ich wähle Geschlecht "weiblich" → Liste zeigt nur weibliche Athleten
- [ ] Ich wähle Jahr 2024 → Liste zeigt nur Punkte aus 2024
- [ ] Ich kombiniere mehrere Filter → Liste zeigt Schnittmenge (AND)
- [ ] Ich klicke "Filter zurücksetzen" → Alle Filter werden entfernt

### Punkte-Berechnung
- [ ] Punkte werden korrekt summiert basierend auf Filter
- [ ] Bei Zeit-Filter "2024": Nur Ergebnisse aus 2024 werden gezählt
- [ ] Bei Turnier-Filter "LET": Nur LET-Ergebnisse werden gezählt
- [ ] Kombination: Nur Ergebnisse die ALLE Kriterien erfüllen

### Export
- [ ] Ich kann "Als CSV exportieren" klicken
- [ ] Ich kann "Als PDF exportieren" klicken (für schöne Druck-Ansicht)
- [ ] Export enthält immer die gefilterte Liste
- [ ] Dateiname enthält Zeitstempel (rangliste_2024-02-11.csv)

### Leistungs-Chart
- [ ] Auf Athleten-Detailseite sehe ich ein Linien-Diagramm
- [ ] X-Achse: Zeit (Monate)
- [ ] Y-Achse: Kumulierte Punkte
- [ ] Hover zeigt Turnier-Name und Punkte

## Edge Cases

### EC-1: Keine Ergebnisse für Filter
- **Szenario:** Kombination aus Filtern ergibt keine Treffer
- **Lösung:** Anzeige: "Keine Athleten gefunden für diese Filter. Bitte Filter anpassen."

### EC-2: Gleiche Punktzahl
- **Szenario:** Zwei Athleten haben exakt gleich viele Punkte
- **Lösung:** Gleicher Rang (z.B. beide Rang 3), nächster Athlet ist Rang 5 (nicht 4)

### EC-3: Sehr viele Athleten
- **Szenario:** 1000+ Athleten in der Datenbank
- **Lösung:** Pagination (50 pro Seite) oder Infinite Scroll

### EC-4: Filter ändert sich während Laden
- **Szenario:** User klickt schnell mehrere Filter
- **Lösung:** Debouncing (500ms warten) + Loading-State

### EC-5: Export sehr großer Datenmengen
- **Szenario:** 500 Athleten exportieren
- **Lösung:** Asynchroner Export mit Progress-Bar oder Email-Versand

## Abhängigkeiten
- PROJ-1: Athleten anlegen
- PROJ-2: Turniere anlegen
- PROJ-3: Turnierergebnisse importieren

## MVP-Priorität
**🔴 KRITISCH** - Kernfeature der App

## Technische Hinweise (für Architect)
- Materialized View oder Caching für schnelle Ranglisten-Berechnung
- Indexe: athlete_id, tournament_id, created_at in results-Tabelle
- Aggregation: SUM(points) GROUP BY athlete_id
- Filter-Logik: WHERE clauses auf Joins
