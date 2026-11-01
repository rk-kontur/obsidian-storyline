# Changelog: fork storyline-km

Changes of this fork compared to the original StoryLine plugin by Jan Sandström. Each `## <version>` section is used automatically as the text of the matching GitHub release. Every release also carries `storyline-km-source.zip` (all source files that are new or changed compared to the original, without `main.js`) and `storyline-km.patch` (the full diff against the original).

## 1.11.8-km.10

**Inspector: "Realized" sits in the Arc point row**

- The link control is now on the same line as the **Arc point** checkbox: `☑ Arc point   Realized [not yet ▾]`. No separate row any more.
- The dropdown shows **not yet** as long as no scene is linked.

**How and where to use:**

1. Click the Arc Point scene in Board or Timeline (or use **Open Scene Details Sidebar**) to open the Inspector.
2. Tick **Arc point**. Next to it, **Realized** and the dropdown appear.
3. Pick the scene that tells this stage. Pick **not yet** to remove the link.

**Files:**

- `components/RealizedByControl.ts` (label, placement)
- `components/Inspector.ts` (renders into the Arc point row)
- `styles.css` (fork section)

## 1.11.8-km.9

**Subway map: finer dashed link for realized Arc Points**

- The dashed link between a realized Arc Point and its scene has shorter gaps (12/4 instead of 12/8) and lower opacity (55 % instead of 75 %).

**How and where to use:**

1. Open **Plotlines** in **Subway** mode with at least one Arc Point linked via **realized by** (Inspector).
2. The link between the diamond and the scene is now a denser, lighter dashed line.

**Files:**

- `utils/arcRealization.ts` (dash pattern, opacity)

## 1.11.8-km.8

**Realized by: one-line dropdown, dashed link in the Subway map**

- **Inspector:** The "Realized by" row is now a single line: label **realized by** plus a dropdown. Default is **not yet**; the list contains all regular scenes, sorted by act and sequence. Choosing **not yet** removes the link.
- **Subway map:** A realized Arc Point is now joined to its scene with a **dashed** line in the Arc Point's colour, so it is clearly different from the solid connector of a scene that sits on several plotlines.
- A `realizedBy` link typed by hand that cannot be resolved shows up in the dropdown as "(not found)" instead of being hidden.

**How and where to use:**

1. Click the Arc Point scene in Board or Timeline (or use **Open Scene Details Sidebar**) to open the Inspector.
2. With **Arc point** ticked, the row **realized by** appears right below it.
3. Pick the scene from the dropdown. Pick **not yet** to remove the link.
4. Open **Plotlines** in **Subway** mode: the diamond sits at the scene's station, connected by a dashed line.

**Files:**

- `components/RealizedByControl.ts` (dropdown)
- `utils/arcRealization.ts` (splitRealizedLanes, drawRealizedLinks)
- `views/StorylineView.ts` (+3)
- `styles.css` (fork section)

## 1.11.8-km.7

**Arc Points: "Realized by" links a stage to the scene that tells it**

- An Arc Point is a stage a character goes through, not a scene. That stage is often told in another scene, even another character's (e.g. Mark's "goes home for the funeral" is told in a Yasemin scene where she sees him there).
- **Inspector:** Arc Points get a "Realized by" row below the Arc Point checkbox. "Choose…" picks the scene, "×" removes the link. Stored as `realizedBy: "[[Scene]]"` in the Arc Point's frontmatter.
- **Subway map:** A linked Arc Point no longer gets its own station. Its diamond sits on its own lines at the station of the linked scene, and the interchange connector joins both lines. Unlinked Arc Points stay where they are, so open diamonds show stages that are not told yet.
- Useful for Story Grid conventions and obligatory scenes: put them as Arc Points on their own line (e.g. `Genre: Thriller`) and link each to the scene that delivers it.
- With the "Arc Points" filter (scenes hidden), Arc Points fall back to their own stations.

**How and where to use:**

1. Open any view with the Inspector (Board, Timeline, Plot Grid) and click the Arc Point scene. The Inspector opens on the right.
2. Make sure **Arc point** is ticked. Directly below it, the row **Realized by** appears.
3. Click **Choose…** and pick the scene that tells this stage (search by title). Click **Change** to pick another one, **×** to remove the link.
4. Open the **Plotlines** view in **Subway** mode: the diamond now sits on the Arc Point's line at the station of the linked scene, joined by the vertical connector.
5. Alternatively type it by hand in the Arc Point's frontmatter: `realizedBy: "[[Funeral]]"`.

**Files:**

- `utils/arcRealization.ts` (new)
- `components/RealizedByControl.ts` (new)
- `components/Inspector.ts` (+3)
- `views/StorylineView.ts` (+6)
- `styles.css` (fork section)

## 1.11.8-km.6

**Report: open setups at the end of each volume**

- The "Volumes" section in Statistics now lists, per volume, every setup that is still open at the end of that volume: its payoff lies in a later volume, in no volume, or does not exist.
- Each entry shows where the payoff is ("Volume 3", "missing"). Click the setup to open the scene.
- Setup/payoff links are read from both sides (`payoff_scenes` on the setup, `setup_scenes` on the payoff), matched by scene title like the built-in Validator. `[[wikilinks]]` are accepted.
- Only shown when the project file defines `volumes:`.

**How and where to use:**

1. Define `volumes:` in the project file (see 1.11.8-km.4).
2. Link setups and payoffs as usual in the Inspector (Setup / Payoff fields).
3. Open the **Statistics** view. In the **Volumes** section at the top, scroll to **Open setups at end of volume**.
4. Expand a volume to see its open setups and where each payoff lies. Click a setup to open the scene.

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

**How and where to use:**

1. Define `volumes:` in the project file (see 1.11.8-km.4).
2. **Filter:** In Board, Manuscript or Plot Grid open the filter panel (funnel icon). Below **Act** you find **Volume**. Click a volume chip.
3. **Statistics and goals:** Open the **Statistics** view. The **Volumes** table is at the top. Add `wordGoal` and `deadline` to a volume to get progress and words per day.
4. **Export:** Command palette → **StoryLine: Export project**, choose content **Manuscript** or **Outline**, then pick a volume under **Volume**.

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

**How and where to use:**

1. Open your project file (the note with `type: storyline` in the project folder).
2. Add a `volumes:` block to its frontmatter as shown above. Use your global act numbers (e.g. volume 2 = acts 5–8).
3. Open the **Plotlines** view (Subway mode), **Timeline** or **Plot Grid**: a volume band appears where each volume starts.
4. Tip: give acts per-volume names with the existing `actLabels:` in the project file, e.g. `5: "Volume 2 · Act 1"`.

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

**How and where to use:**

1. Mark a scene as Arc Point (Inspector → **Arc point** checkbox).
2. Open the **Timeline** view: the card shows the **◆ Arc Point** badge.
3. Use the **All / Scenes / Arc Points** buttons in the Timeline toolbar to filter.
4. Open the **Plot Grid**: linked Arc Point scenes show a small diamond next to the title and in the row header.

**Files:**

- `components/ArcPointUI.ts` (new)
- `views/TimelineView.ts` (+12)
- `views/PlotgridView.ts` (+3)

## 1.11.8-km.2

**Fix: plotline colours in the Subway map**

- Plotline colours shifted whenever the Arc Point filter was toggled or a plotline was hidden. The colour now depends on all plotlines of the project, not only the visible ones. Affects lines, tag pills and the list view.
- The release workflow can be started manually and sets the tag itself.

**How and where to use:**

1. Open the **Plotlines** view in **Subway** mode.
2. Toggle **All / Scenes / Arc Points** or hide a plotline: the colours of the remaining plotlines stay the same.

**Files:**

- `views/StorylineView.ts` (colour index)
- `.github/workflows/release-km.yml`

## 1.11.8-km.1

**First fork version**

- Own plugin id `storyline-km`, so the fork can be installed next to the original. Never enable both at the same time.

**How and where to use:**

1. Install BRAT, add the beta plugin `rk-kontur/obsidian-storyline`.
2. In Settings → Community plugins, disable **StoryLine** and enable the fork (id `storyline-km`). Switch back the same way.

**Files:**

- `manifest.json` (id, version)
- `.github/workflows/release-km.yml` (new)
- `CLAUDE.md` (new)
