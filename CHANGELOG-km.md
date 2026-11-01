# Changelog: fork storyline-km

Changes of this fork compared to the original StoryLine plugin by Jan Sandström. Each `## <version>` section is used automatically as the text of the matching GitHub release. Every release also carries `storyline-km-source.zip` (all source files that are new or changed compared to the original, without `main.js`) and `storyline-km.patch` (the full diff against the original).

## 1.11.8-km.6

**Report: open setups at the end of each volume**

- The "Volumes" section in Statistics now lists, per volume, every setup that is still open at the end of that volume: its payoff lies in a later volume, in no volume, or does not exist.
- Each entry shows where the payoff is ("Volume 3", "missing"). Click the setup to open the scene.
- Setup/payoff links are read from both sides (`payoff_scenes` on the setup, `setup_scenes` on the payoff), matched by scene title like the built-in Validator. `[[wikilinks]]` are accepted.
- Only shown when the project file defines `volumes:`.

**Files:**

- `utils/volumeSetups.ts` (new)
- `components/VolumeStatsSection.ts` (report)
- `views/StatsView.ts` (open scene on click)
- `styles.css` (fork section)

## 1.11.8-km.5

**Volume filter, statistics and goals per volume, export per volume**

- **Volume filter:** The filter panel of Board, Manuscript and Plot Grid gets a "Volume" chip group below "Act". A volume chip selects all acts of that volume; clicking again clears them. Single act chips keep working.
- **Statistics per volume:** Statistics shows a "Volumes" section at the top with scenes, arc points, words, word goal, progress, deadline and words per day needed, per volume.
- **Goals per volume:** `wordGoal` and `deadline` from the `volumes:` definition are evaluated there.
- **Export per volume:** The export dialog offers a "Volume" choice for Manuscript and Outline. Only the acts of the chosen volume are exported.
- Everything appears only when the project file defines `volumes:`.

**Files:**

- `components/VolumeFilterChips.ts` (new)
- `components/VolumeStatsSection.ts` (new)
- `components/Filters.ts` (+6 lines)
- `components/ExportModal.ts` (+17)
- `services/ExportService.ts` (+2)
- `views/StatsView.ts` (+5)
- `utils/volumes.ts` (volumeExportRange)
- `styles.css` (fork section at the end)

## 1.11.8-km.4

**Volumes as act groups**

- New optional `volumes:` block in the project file. A volume is a named group of acts:

  ```yaml
  volumes:
    - id: b1
      title: "Volume 1"
      acts: [1, 2, 3, 4]    # or "1-4"
      wordGoal: 90000       # optional
      deadline: 2027-03-01  # optional
  ```

- Scenes, numbering, sorting and file names stay unchanged. A scene's volume is derived from its act.
- **Volume dividers** in the Subway map (solid line with volume title), Timeline (linear and swimlanes) and Plot Grid.
- Without `volumes:` the plugin behaves exactly like the original.

**Files:**

- `utils/volumes.ts` (new)
- `views/StorylineView.ts` (+17)
- `views/TimelineView.ts` (+5)
- `views/PlotgridView.ts` (+5)
- `styles.css` (new fork section at the end)

## 1.11.8-km.3

**Arc Points in Timeline and Plot Grid**

- **Timeline:** Arc Points carry the "◆ Arc Point" badge known from the Board, in linear and swimlane mode.
- **Timeline:** New "All / Scenes / Arc Points" filter in the toolbar. The choice is remembered per vault.
- **Plot Grid:** Linked Arc Point scenes show a diamond in the mini card and in the row header.

**Files:**

- `components/ArcPointUI.ts` (new)
- `views/TimelineView.ts` (+12)
- `views/PlotgridView.ts` (+3)

## 1.11.8-km.2

**Fix: plotline colours in the Subway map**

- Plotline colours shifted whenever the Arc Point filter was toggled or a plotline was hidden. The colour now depends on all plotlines of the project, not only the visible ones. Affects lines, tag pills and the list view.
- The release workflow can be started manually and sets the tag itself.

**Files:**

- `views/StorylineView.ts` (colour index)
- `.github/workflows/release-km.yml`

## 1.11.8-km.1

**First fork version**

- Own plugin id `storyline-km`, so the fork can be installed next to the original. Never enable both at the same time.

**Files:**

- `manifest.json` (id, version)
- `.github/workflows/release-km.yml` (new)
- `CLAUDE.md` (new)
