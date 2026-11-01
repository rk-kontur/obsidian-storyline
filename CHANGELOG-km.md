# Changelog Fork storyline-km

Änderungen des Forks gegenüber dem Original StoryLine von Jan Sandström. Jeder Abschnitt `## <Version>` wird automatisch als Text des passenden GitHub-Releases übernommen. An jedem Release hängen außerdem `storyline-km-source.zip` (alle gegenüber dem Original neuen oder geänderten Quelldateien, ohne `main.js`) und `storyline-km.patch` (der komplette Unterschied zum Original).

## 1.11.8-km.5

**Band-Filter, Statistik und Ziele pro Band, Export pro Band**

- **Band-Filter:** In der Filterleiste von Board, Manuskript und Plotgrid erscheint unter „Act“ eine Gruppe „Volume“. Ein Band-Chip wählt alle Akte dieses Bands aus, ein zweiter Klick hebt die Auswahl wieder auf. Einzelne Akt-Chips bleiben unabhängig nutzbar.
- **Statistik pro Band:** Die Statistik-Ansicht zeigt oben einen Abschnitt „Volumes“ mit Szenen, Arc Points, Wörtern, Wortziel, Fortschritt, Deadline und nötigen Wörtern pro Tag je Band.
- **Ziele pro Band:** `wordGoal` und `deadline` aus der `volumes:`-Definition werden dort ausgewertet.
- **Export pro Band:** Im Export-Dialog gibt es bei Manuskript und Outline die Auswahl „Volume“. Exportiert werden nur die Akte des gewählten Bands.
- Alles erscheint nur, wenn die Projektdatei `volumes:` enthält.

**Dateien:**

- `components/VolumeFilterChips.ts` (neu)
- `components/VolumeStatsSection.ts` (neu)
- `components/Filters.ts` (+6 Zeilen)
- `components/ExportModal.ts` (+17)
- `services/ExportService.ts` (+2)
- `views/StatsView.ts` (+5)
- `utils/volumes.ts` (volumeExportRange)
- `styles.css` (Fork-Abschnitt am Ende)


## 1.11.8-km.4

**Bände als Akt-Gruppen**

- Neuer optionaler Block `volumes:` in der Projektdatei. Ein Band ist eine benannte Gruppe von Akten:

  ```yaml
  volumes:
    - id: b1
      title: "Band 1"
      acts: [1, 2, 3, 4]    # oder "1-4"
      wordGoal: 90000       # optional
      deadline: 2027-03-01  # optional
  ```

- Szenen, Nummerierung, Sortierung und Dateinamen bleiben unverändert. Die Band-Zugehörigkeit ergibt sich aus dem Akt.
- **Band-Trenner** in Subway-Map (durchgezogene Linie mit Bandtitel), Timeline (linear und Swimlanes) und Plotgrid.
- Ohne `volumes:` verhält sich das Plugin wie das Original.

**Dateien:**

- `utils/volumes.ts` (neu)
- `views/StorylineView.ts` (+17)
- `views/TimelineView.ts` (+5)
- `views/PlotgridView.ts` (+5)
- `styles.css` (neuer Fork-Abschnitt am Ende)


## 1.11.8-km.3

**Arc Points in Timeline und Plotgrid**

- **Timeline:** Arc Points tragen das Abzeichen „◆ Arc Point“ wie auf dem Board, in linearer Ansicht und in Swimlanes.
- **Timeline:** Neuer Filter „All / Scenes / Arc Points“ in der Werkzeugleiste. Die Auswahl wird pro Vault gespeichert.
- **Plotgrid:** Verknüpfte Arc-Point-Szenen zeigen eine Raute in der Mini-Karte und im Zeilenkopf.

**Dateien:**

- `components/ArcPointUI.ts` (neu)
- `views/TimelineView.ts` (+12)
- `views/PlotgridView.ts` (+3)


## 1.11.8-km.2

**Fix: Plotline-Farben in der Subway-Map**

- Die Farben der Plotlines verschoben sich, sobald der Arc-Point-Filter umgeschaltet oder eine Plotline ausgeblendet wurde. Die Farbe richtet sich jetzt nach allen Plotlines des Projekts, nicht nur nach den sichtbaren. Betrifft Linien, Tag-Schilder und Listenansicht.
- Release-Workflow lässt sich manuell starten und setzt den Tag selbst.

**Dateien:**

- `views/StorylineView.ts` (Farbindex)
- `.github/workflows/release-km.yml`


## 1.11.8-km.1

**Erste Fork-Version**

- Eigene Plugin-ID `storyline-km`, damit der Fork neben dem Original installiert werden kann. Nie beide gleichzeitig aktivieren.

**Dateien:**

- `manifest.json` (id, version)
- `.github/workflows/release-km.yml` (neu)
- `CLAUDE.md` (neu)
