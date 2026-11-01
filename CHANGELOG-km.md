# Changelog: fork storyline-km

Changes of this fork compared to the original StoryLine plugin by Jan Sandström. Each `## <version>` section is used as the initial text of the matching GitHub release; texts edited on GitHub (e.g. with screenshots) are never overwritten. Every release also carries `storyline-km-source.zip` (all source files that are new or changed compared to the original, without `main.js`) and `storyline-km.patch` (the full diff against the original).

## 1.12.0-km.14

**"Delete plotline" shows what is really affected, per volume**

- Deleting a plotline removes its tag from **every** scene of the project. With a volume selected, the dialog used to count only the scenes of that volume, so it promised far fewer changes than it made.
- The dialog now says how many scenes carry the plotline in the current selection, and warns how many **more** scenes in how many **other volumes** will lose the tag as well.
- Below, one column per volume lists every affected scene side by side; the selected volume is highlighted.
- Two extra columns when needed: **No act** (scenes without an act; they are visible under every volume selection and count as part of it) and **Not in a volume** (acts that belong to no volume, or an empty `act:`).
- Inactive scenes and corkboard notes are counted too, because the tag is removed from them as well; the dialog names them in an extra line.
- Without volumes, the dialog shows the correct total for the whole project, as before.

<!-- screenshot: Delete plotline dialog with one column per volume -->

**How and where to use:**

1. Select a volume in any volume dropdown.
2. **Plotlines** (list view) → plotline header → delete icon, or right-click → delete.
3. Read the overview, then **Delete** or **Cancel**.

**Files:**

- `components/PlotlineDeleteImpact.ts` (new: impact per volume and dialog text)
- `views/StorylineView.ts` (+3: dialog uses it)
- `styles.css` (fork section: columns)

## 1.12.0-km.13

**Statistics for off page plotlines**

When at least one plotline is marked off page (Subway map → right-click a line name → Move to off page), the Statistics view reports how far the background developments already reach the text.

- **Overview card "Off page stages told":** realized stages / all stages of all off page lines, e.g. "12 / 30". A stage (Arc Point) counts as told when it is linked to a scene via **Realized** in the Inspector.
- **New section "Off page coverage"** (below Progress Breakdown): one row per off page line with a progress bar, "x / y realized" and the number of regular scenes on that line. Expanded, it lists the stages **not yet told** and the ones **told in** which scene; every entry opens the note.
- **Warnings:** act gap warnings ("Plotline X has no scenes in Act 5", "last seen in Act 3") are no longer shown for off page lines; sparse appearance is normal for them. Instead, one note per line lists the stages that are not yet told.
- Follows the volume selector: with a volume selected, only that volume's stages are counted (the realizing scene may be in any volume).
- Word counts are unchanged: scenes on off page lines are written text and count as usual; Arc Points follow your existing word count setting.

<!-- screenshot: Statistics overview with the Off page card -->
<!-- screenshot: Off page coverage section -->

**How and where to use:**

1. Mark plotlines as off page in the **Subway map** (right-click the line name → **Move to off page**).
2. Link stages to their scenes: Inspector of the Arc Point → **Realized** → pick the scene.
3. Open **Statistics**: see the **Off page stages told** card, the **Off page coverage** section and the adjusted **Warnings**.

**Files:**

- `components/OffPageStatsSection.ts` (new: coverage, overview value, warning adjustment, section rendering)
- `views/StatsView.ts` (overview card, section, warnings)
- `styles.css` (fork section)

## 1.12.0-km.12

**Manuscript no longer turns blank with Pane Relief's "Maximize active tab"**

- With a maximized tab (Pane Relief), switching to the Manuscript from another view showed an empty page. The Manuscript hosts one embedded editor per scene; while they load, Obsidian briefly reports one of them as the active tab, and Pane Relief maximized that hidden editor instead of the Manuscript.
- The Manuscript now hands the maximized state back to itself when that happens. Without Pane Relief, or without a maximized tab, nothing changes.

**How and where to use:**

1. In Pane Relief, maximize the StoryLine tab ("Maximize active tab").
2. Switch to the **Manuscript** from any other StoryLine view: the manuscript stays visible.

**Files:**

- `utils/paneReliefCompat.ts` (new: give the maximized state back to the view that owns the embedded editor)
- `views/ManuscriptView.ts` (+5: run the check on load, on active tab change and on layout change)

## 1.12.0-km.11

**Timeline: POV character no longer listed twice on a card**

- A Timeline card showed the POV character twice when it was also entered under Characters: once as "POV: Yasemin" and again in the character list below. The list now leaves out the POV character, as the Board cards already do. `Yasemin` and `[[Yasemin]]` count as the same character.

<!-- screenshot: Timeline card with POV and characters -->

**How and where to use:**

1. Open the **Timeline** (linear mode). A scene with POV Yasemin and Characters Yasemin, Mark shows "POV: Yasemin" and below only "Mark".

**Files:**

- `views/TimelineView.ts` (character list without the POV character)

## 1.12.0-km.10

**The POV character counts as a character of the scene everywhere**

Character View, Statistics, the Validator and the scene cards already treated the POV character as part of the scene. Two places did not, so a POV character had to be entered a second time under Characters:

- **Character filter** (filter panel in Board, Manuscript, Plot Grid): filtering by a character now also finds the scenes where that character is only the POV.
- **Timeline swimlanes "By Character":** a scene now also appears in the lane of its POV character.

Names are compared without `[[ ]]`, alias and case, so `Yasemin` and `[[Yasemin]]` match. A character listed both as POV and under Characters is counted once.

<!-- screenshot: Timeline swimlanes by character with a POV-only scene -->

**How and where to use:**

1. Give a scene a POV character (Inspector → **POV**); no need to add the same character under **Characters**.
2. **Board / Manuscript / Plot Grid → filter panel → Characters:** choose the character; its POV scenes are included.
3. **Timeline → swimlanes → Group by Character:** the scene shows up in the POV character's lane.

**Files:**

- `utils/sceneCharacters.ts` (new: characters of a scene incl. POV, name comparison)
- `services/SceneQueryService.ts` (+2: character filter uses it)
- `views/TimelineView.ts` (+2: swimlanes by character use it)

## 1.12.0-km.9

**Off page plotlines in the Plotlines list, Timeline swimlanes and Plot Grid**

- **Plotlines list view:** plotlines are grouped under **ON PAGE** and **OFF PAGE** headings, off page sections lightly tinted, same order as in the Subway map.
- **Timeline, swimlanes "By Plotline" / "By Tag":** off page lanes come last and are lightly tinted.
- **Plot Grid:** plotline columns (created by Sync from scenes) of off page lines are lightly tinted. Their position is not changed, so your column layout stays as you arranged it.

<!-- screenshot: Plotlines list with ON PAGE / OFF PAGE headings -->
<!-- screenshot: Timeline swimlanes with tinted off page lanes -->

**How and where to use:**

1. Mark a plotline as off page: **Plotlines → Subway** → right-click the line name → **Move to off page**.
2. **Plotlines → list view** (list icon): the line appears under OFF PAGE.
3. **Timeline → swimlanes → Group by Plotline**: the line's lane is the last one, tinted.
4. **Plot Grid**: the plotline's column is tinted.

**Files:**

- `utils/pageZones.ts` (list heading)
- `views/StorylineView.ts` (list view grouping)
- `views/TimelineView.ts` (swimlane order and tint)
- `views/PlotgridView.ts` (column tint)
- `styles.css` (fork section)

## 1.12.0-km.8

**Subway map: off page band also behind the line names**

- The tinted OFF PAGE band now continues behind the line names in the name column on the left, so the zone reads as one band across the whole width.
- More space above the off page lines; the OFF PAGE header sits with some air above the first line name.

<!-- screenshot: Subway map with tinted name column in the off page zone -->

**How and where to use:**

1. Open **Plotlines** in **Subway** mode with at least one line moved to off page (right-click a line name → **Move to off page**).
2. The tint covers the line names and the map.

**Files:**

- `utils/pageZones.ts` (band in the name column, larger zone gap)
- `views/StorylineView.ts` (+1)
- `styles.css` (fork section: name column band)

## 1.12.0-km.7

**Subway map: "on page" and "off page" zones**

Some plotlines are not told in scenes but develop in the background: a character arc, technology, politics, the conventions and obligatory scenes of a genre. Such a plotline can now be marked **off page**. The Subway map then shows two zones:

- **ON PAGE** at the top: the plotlines that are told in the written scenes.
- **OFF PAGE** below, in a lightly tinted band: the background developments.

Details:

- **Explicit choice per plotline**, independent of its content: an off-page line may contain scenes and Arc Points, an on-page line as well. Arc Points work the same in both zones.
- **Realized Arc Points** connect across the zones: the dashed link runs from the off-page stage up to the scene that tells it. This shows at a glance which background development already reaches the text.
- Without off-page lines, nothing changes (no band, no headers).
- Stored in the project file as `offPageLines: [Mark, Politics]`; it can also be edited by hand.
- The band colour and the headers can be styled with CSS (`.sl-km-offpage-band`, `.sl-km-zone-header`).

<!-- screenshot: Subway map with ON PAGE and OFF PAGE zones -->

**How and where to use:**

1. Open **Plotlines** in **Subway** mode.
2. **Right-click a plotline name** in the name column on the left → **Move to off page**. The line moves into the tinted OFF PAGE band at the bottom.
3. To move it back: right-click → **Move to on page**.
4. Optional: link Arc Points on an off-page line to the scene that tells them (Inspector → **Realized**) to see where the background reaches the text.

**Files:**

- `utils/pageZones.ts` (new: zones, ordering, band, headers, context menu, project file storage)
- `views/StorylineView.ts` (lane order by zone, zone gap, band, headers, right-click on line names)
- `styles.css` (fork section: default band tint and header style)

## 1.12.0-km.6

**Subway map: volume name in the act labels**

- The act labels above the Subway map now read **"VOLUME 1 ACT 1"**, "VOLUME 1 ACT 2" … for acts that belong to a volume. The separate volume title at the top left of each volume is gone; the solid volume divider line stays.
- Acts without a volume keep their plain label ("ACT 9").

<!-- screenshot: Subway map act labels with volume names -->

**How and where to use:**

1. Define volumes (Manage story structure → Volumes).
2. Open **Plotlines** in **Subway** mode: each act label carries its volume name.

**Files:**

- `views/StorylineView.ts` (act label with volume name)
- `utils/volumes.ts` (+1: volume marker without separate title)

## 1.12.0-km.5

**Filter bar: "Type" and "State" labels, no more cut-off buttons**

- The filter bar has two independent toggle groups that both contain an "All" button, which looked like a duplicate. They are now labelled:
  - **Type:** All · Scenes · Arc Points (regular scenes vs. Arc Points)
  - **State:** Active · All · Inactive (active vs. parked scenes)
- Both groups can still be combined, e.g. "Arc Points" + "All" shows active and inactive Arc Points.
- The buttons are no longer cut off ("Arc Poi", "Inacti"); the search field gets narrower instead.
- CSS only (fork section of `styles.css`); the upstream filter logic and markup are unchanged.

<!-- screenshot: filter bar with Type and State labels -->

**How and where to use:**

1. Open **Board**, **Manuscript** or **Plot Grid**.
2. In the filter bar, **Type** filters by scene kind, **State** by active / inactive.

**Files:**

- `styles.css` (fork section: labels via `::before`, no-shrink buttons, flexible search field)

## 1.12.0-km.4

**Export dialog: Volume choice next to Content and Format**

- The **Volume** dropdown now sits directly below **Format**, above the Export / Cancel buttons, with some space before the buttons. Before, it was squeezed in right below the buttons.

<!-- screenshot: export dialog with Volume below Format -->

**How and where to use:**

1. Command palette → **StoryLine: Export project**.
2. Choose **Content** (Manuscript or Outline) and **Format**.
3. Choose a **Volume** right below, then **Export**.

**Files:**

- `components/ExportModal.ts` (own container for the volume choice)
- `styles.css` (fork section)

## 1.12.0-km.3

**Statistics per volume and across all volumes, volume filter in the filter bar, Plot Grid hides empty plotlines, fixes**

The Statistics view now follows the shared volume selector (same dropdown as in the other views). Every section counts either one volume or the whole series.

### One volume selected

- Heading: "<Volume> statistics".
- **All sections count only the acts of that volume:** overview (scenes, words, read time), Progress Breakdown (status, acts), **Characters & World (POV share, characters, locations)**, Pacing & Tension incl. tension curve and Pacing Coach, Prose Analysis, Dialogue vs Narrative, Setup & Payoff Map, Echo Finder, Folder Word Counts, Warnings.
- **Word goal:** the volume's word goal; if none is set, the sum of the scene targets in that volume; otherwise the project goal from the settings.
- **Deadline:** the volume's deadline; otherwise the project deadline. Remaining words and words per day are calculated against it.

### All volumes

- Heading: "Project statistics (all volumes)".
- All sections count the whole project (collected word counts of all volumes), exactly as before.
- **Word goal:** the sum of all volume word goals that are set; if no volume has a goal, the project goal from the settings.
- **Deadline:** the project deadline from the settings; if none is set, the latest volume deadline.

### Volumes table

- New last row **All volumes** with the totals: scenes, Arc Points, words, summed word goal, progress, latest deadline, words per day needed.
- The selected volume (or "All volumes") is highlighted.
- The table and the "Open setups at end of volume" report always show all volumes, independent of the selection.

### Stays project-wide on purpose

- **Writing Sprint, Writing History, Writing Trail and the pace projection** are based on the words you write per day. StoryLine records them per project, not per scene or volume, so they cannot be split by volume.

### Volume selector in the filter bar

- In **Board**, **Manuscript** and **Plot Grid** the volume dropdown now sits at the very left of the filter bar: **Filter by [Volume ▾]**, then **Search scenes…** and the other filter controls. (Before, it was in the toolbar; in Manuscript it did not appear at all.)
- Timeline, Plotlines (Subway), Navigator and Statistics have no filter bar; there the dropdown stays in the toolbar.
- The selection is now stored **per project**. Switching to another book of a series no longer carries the selected volume over.

### Plot Grid: empty plotlines are hidden automatically

- While a volume is selected, plotline columns (and other columns created by **Sync from scenes**) that have no content and no linked scene in that volume are hidden, just like the Subway map only shows lines that are active in the volume.
- Columns you created by hand always stay visible.
- On the right of the filter bar: **"3 empty plotlines hidden · show"**. Click to show them for this session, click **Hide empty plotlines** to hide them again.
- With **All volumes** every column is shown. Nothing is deleted; hidden columns keep their cells.

### Fixes

- **Corkboard / Kanban:** sticky notes, image notes and scenes without an act no longer disappear while a volume is selected.
- **Plot Grid:** rows were shifted by one track as soon as `volumes:` was defined (wrong row heights, row resize on the wrong row). Fixed.
- **Timeline, chronological order:** dragging a scene while a volume (or the Arc Point filter) was active renumbered only the visible scenes and could mix up the chronological order of the whole project. The order is now always renumbered across all scenes.
- **Timeline:** empty act placeholders of other volumes are no longer shown while a volume is selected.
- **New scenes** created while a volume is selected start in the first act of that volume (Board and Timeline "+ new scene"), so they do not vanish right after creation.
- **Statistics, one volume selected:** setups/payoffs that cross a volume border were reported as "doesn't exist" in Warnings and as broken in the Setup & Payoff Map. Linked scenes of other volumes are now taken into account.
- **Statistics:** Writing Sprint always uses the project word total, so session words are correct while a volume is selected.
- **Subway:** a realized Arc Point that shares a plotline with its scene no longer hides that scene's station on the shared line.
- **Export:** a volume export is named "… Acts 5,6,7,8" instead of "… Chapters 5,6,7,8".
- **Manage volumes command:** works even if the Board tab has not been loaded yet.
- **Volumes editor:** sees acts added in the same dialog (beat sheet, Add acts).

<!-- screenshot: filter bar with "Filter by" volume dropdown -->
<!-- screenshot: Plot Grid with hidden empty plotlines hint -->
<!-- screenshot: Statistics with "Volume 2 statistics" heading and the volumes table with the All volumes row -->

**How and where to use:**

1. Open the **Statistics** view.
2. Choose a volume in the volume dropdown in the toolbar (or in any other view; the selection is shared).
3. All sections update to that volume. Choose **All volumes** for the whole series.
5. **Filter bar:** in Board, Manuscript or Plot Grid, use **Filter by [Volume ▾]** at the left of the filter bar.
6. **Plot Grid:** select a volume; empty plotline columns disappear. Use the hint on the right of the filter bar to show them.
4. Set word goals and deadlines per volume in **Manage story structure → Volumes** (or **Edit volumes** in the Volumes table).

**Files:**

- `utils/volumeStatsScope.ts` (new: goal and deadline per volume / all volumes, heading, link partners, validation)
- `utils/plotgridVolume.ts` (new: hide empty auto columns)
- `utils/volumeScope.ts` (per-project selection, act-less scenes kept, default act, filter bar control, reorder helper)
- `utils/arcRealization.ts` (shared lane fix)
- `components/Filters.ts` (+5: volume control at the left, extra controls at the right)
- `components/StructureModalSections.ts`, `components/VolumesEditor.ts` (live act list)
- `views/PlotgridView.ts` (hidden columns, hint, volume band track)
- `views/TimelineView.ts` (chronological renumber, empty acts, default act)
- `views/BoardView.ts` (dropdown moved to filter bar, default act)
- `views/ManuscriptView.ts` (dropdown moved to filter bar)
- `views/StorylineView.ts` (+1: deduplicate columns)
- `services/ExportService.ts` (+1: "Acts" label)
- `services/ForkCommands.ts` (load deferred tab)
- `components/VolumeStatsSection.ts` (All volumes row, highlight)
- `views/StatsView.ts` (volume dropdown, scoped scenes and statistics, goal, deadline, tension curve, Pacing Coach, read time)
- `services/SceneQueryService.ts` (+2: `getStatistics` accepts an optional scene subset)
- `styles.css` (fork section)
- `.github/workflows/release-km.yml` (compare links, delta patch)

## 1.12.0-km.2

**"Manage story structure": collapsible sections like the plugin settings, wider dialog**

- The tabs are replaced by collapsible sections with the same look as the plugin settings: **Volumes**, **Acts**, **Chapters**, **Templates**. Several sections can be open at the same time; which ones are open is remembered.
- **Templates** contains beat sheet templates, saved custom beat sheets and the custom structure builder as nested collapsible blocks.
- The dialog is wider (up to 960 px) and no longer shows a horizontal scrollbar.
- Fix: "Apply custom structure" / "Save as beat sheet" were shown below every tab; they now sit inside the custom structure builder where they belong. **Done** stays at the bottom of the dialog.
- The command **Manage volumes** opens the dialog with the Volumes section expanded.

<!-- screenshot: dialog with collapsible sections -->

**How and where to use:**

1. Open the dialog: Board or Timeline toolbar → structure button (columns icon), or Command palette → **StoryLine: Manage story structure** / **StoryLine: Manage volumes**.
2. Click a section title (▸ Volumes, ▸ Acts, ▸ Chapters, ▸ Templates) to expand or collapse it.
3. Close with **Done**.

**Files:**

- `components/StructureModalSections.ts` (renamed from `StructureModalTabs.ts`, sections instead of tabs)
- `services/ForkCommands.ts` (open a given section)
- `views/BoardView.ts`, `views/TimelineView.ts` (hook renamed)
- `styles.css` (fork section: dialog width, no horizontal scrollbar)

## 1.12.0-km.1

**Volumes in every view, one shared volume selector**

This release completes the volume feature (series with several volumes in one project). A volume is a named group of acts, defined in the **Volumes** tab of **Manage story structure** (see 1.11.8-km.12). This release adds a **shared volume selector** that works across all views and shows volume boundaries everywhere.

Nothing changes for projects without volumes: the selector, badges and dividers only appear once at least one volume is defined.

### 1. Shared volume selector ("All volumes / Volume 1 / …")

- A dropdown in the toolbar of **Board (Kanban and Corkboard)**, **Plot Grid**, **Timeline**, **Plotlines (Subway)**, **Manuscript** and the **Navigator** sidebar.
- It is **one setting for all views**: choose "Volume 2" in the Board, and Timeline, Subway, Plot Grid, Manuscript and Navigator show Volume 2 as well. Every open StoryLine view refreshes immediately.
- **All volumes** shows the whole project as before.
- Remembered per vault.
- Works together with all existing filters: the volume restricts the acts, the other filters (status, POV, tags, Arc Points …) still apply. If an act filter is active, only its acts inside the selected volume remain.
- Not affected on purpose: **Statistics** (always shows the per-volume table) and **Export** (has its own "Volume" choice).

<!-- screenshot: toolbar with the volume dropdown -->

### 2. Volume boundaries in each view

| View | What you see |
|---|---|
| **Board · Kanban** (grouped by act) | A narrow vertical band with the volume title between the act columns where a new volume starts. |
| **Board · Kanban and Corkboard** | Every scene card shows a small badge such as **V2** at the right of the card header (hover: full volume title). |
| **Plot Grid** | A full-width volume band above the first act divider of each volume. |
| **Timeline** (linear and swimlanes) | A volume band above the first act divider of each volume. |
| **Plotlines · Subway** | A solid line with the volume title (instead of the dashed act divider) where a volume starts. |
| **Manuscript** | A volume heading above the first act divider of each volume. |
| **Navigator** (grouped by act) | A volume heading above the first act of each volume. |

<!-- screenshot: Kanban with volume band and V-badges -->
<!-- screenshot: Corkboard cards with V-badges -->
<!-- screenshot: Manuscript with volume heading -->
<!-- screenshot: Navigator with volume headings -->

### 3. Overview: all volume features so far

- **Define volumes:** Manage story structure → **Volumes** tab (title, acts from–to, word goal, deadline). Command: **Manage volumes**. (1.11.8-km.12)
- **Select a volume for all views:** volume dropdown in any toolbar. (this release)
- **Volume chips in the filter panel** of Board, Manuscript, Plot Grid: select the acts of one or more volumes. (1.11.8-km.5)
- **Statistics → Volumes:** scenes, words, goal, progress, deadline, words per day, and **open setups at the end of each volume**. (1.11.8-km.5, km.6)
- **Export:** "Volume" choice for Manuscript and Outline. (1.11.8-km.5)

**How and where to use:**

1. Define volumes once: Command palette → **StoryLine: Manage volumes** (or the structure button in Board / Timeline → **Volumes** tab) → **+ Add volume**.
2. Open any StoryLine view. In its toolbar you now find the volume dropdown:
   - **Board:** left of the Corkboard / Kanban switch.
   - **Plot Grid:** at the start of the toolbar.
   - **Timeline:** left of the All / Scenes / Arc Points buttons.
   - **Plotlines (Subway):** left of the All / Scenes / Arc Points buttons.
   - **Manuscript:** below the filter bar.
   - **Navigator:** between the search field and the sort button.
3. Choose a volume. All open views switch to it. Choose **All volumes** to see everything again.
4. Kanban shows the volume bands only when **Group by** is set to **Act**. The V-badges on cards are always shown when volumes exist.

**Files:**

- `utils/volumeScope.ts` (new: shared scope, dropdown, card badge)
- `utils/volumes.ts` (Kanban column band, act from column key)
- `components/SceneCard.ts` (+2, volume badge)
- `views/BoardView.ts` (dropdown, scope for Kanban and Corkboard, column bands)
- `views/PlotgridView.ts` (dropdown, scope)
- `views/TimelineView.ts` (dropdown, scope)
- `views/StorylineView.ts` (dropdown, scope)
- `views/ManuscriptView.ts` (dropdown, scope, volume headings)
- `views/NavigatorView.ts` (dropdown, scope, volume headings)
- `styles.css` (fork section)
- `.github/workflows/release-km.yml` (release texts edited on GitHub are never overwritten)

## 1.11.8-km.12

**Volumes editor, tabbed "Manage story structure" dialog, new commands**

- **Volumes editor:** No more hand-editing YAML. Each volume is one row: title, from act, to act, word goal, deadline (date picker), remove. **+ Add volume** proposes the next free acts with the size of the previous volume. Acts assigned to two volumes are marked red; acts without a volume are listed. Changes are saved automatically to the `volumes:` block of the project file.
- **"Manage story structure" as tabs:** The dialog is split into **Volumes | Acts | Chapters | Templates**. Templates holds beat sheet templates, saved custom beat sheets and the custom structure builder as collapsible blocks. The last used tab is remembered. If a future upstream version changes the dialog, it simply falls back to its original layout.
- **New commands** (assign a hotkey in Settings → Hotkeys): **Manage story structure** and **Manage volumes** (opens the dialog on the Volumes tab). Both work from anywhere; if neither Board nor Timeline is open, the Board is opened first.
- **Statistics:** the Volumes section has an **Edit volumes** button.

**How and where to use:**

1. Open the dialog in one of these ways:
   - Board or Timeline toolbar → structure button (columns icon), or
   - Command palette (`Ctrl/Cmd + P`) → **StoryLine: Manage story structure** / **StoryLine: Manage volumes**, or
   - Statistics → Volumes → **Edit volumes**.
2. Go to the **Volumes** tab, click **+ Add volume**, adjust title, acts, goal and deadline.
3. Close with **Done**. The volume dividers, filter chips, statistics and export options use the new volumes right away.
4. Hotkey: Settings → Hotkeys → search "Manage story structure" → set a key combination.

**Files:**

- `components/VolumesEditor.ts` (new)
- `components/StructureModalTabs.ts` (new)
- `services/ForkCommands.ts` (new)
- `views/BoardView.ts` (+3, tab hook)
- `views/TimelineView.ts` (+3, tab hook)
- `main.ts` (+2, registers the commands)
- `components/VolumeStatsSection.ts` (Edit volumes button)
- `views/StatsView.ts` (+2)
- `styles.css` (fork section)

## 1.11.8-km.11

**Subway map: dashed realized link blends colours**

- The dashed link between a realized Arc Point and its scene now blends from the Arc Point's plotline colour to the scene's plotline colour, like the solid connectors between plotlines.
- Opacity 65 %.

**How and where to use:**

1. Link an Arc Point to a scene via **Realized** in the Inspector (next to **Arc point**).
2. Open **Plotlines** in **Subway** mode: the dashed link runs in a colour gradient between both lines.

**Files:**

- `utils/arcRealization.ts` (gradient, opacity)

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
