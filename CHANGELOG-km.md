# Changelog: fork storyline-km

Changes of this fork compared to the original StoryLine plugin by Jan Sandström. Each `## <version>` section is used as the initial text of the matching GitHub release; texts edited on GitHub (e.g. with screenshots) are never overwritten. Every release also carries `storyline-km-source.zip` (all source files that are new or changed compared to the original, without `main.js`) and `storyline-km.patch` (the full diff against the original).

## 1.11.8-km.31

**Plotline colours in more views, switched on per view**

- New settings block **Transfer plotline colors to** (Settings → Colors → Plotline color scheme), five toggles, all off by default. A view that is switched on shows each plotline in the colour the Board already uses (custom plotline colours, colour scheme and HSL sliders included):
    - **Plot Grid:** headers of columns synced from plotlines get the plotline colour; your own column colours still win. The `#tag` chips in the cell inspector use the same colour.
    - **Timeline:** with swimlanes grouped by plotline or tag, each lane header gets a coloured left border.
    - **Inspector:** the plotline pills of a scene are coloured.
    - **Filters:** the tag chips in the filter panel get a small colour dot.
    - **Navigator:** each scene row gets a small bar next to the status dot, split into one colour segment per plotline. Rows without plotlines keep the same space, so titles stay aligned.
- The Subway map and the Plotlines list already use these colours in this build (since 1.11.8-km.2), so they have no toggle here.
- With the "custom" colour scheme and no colour set for a plotline, these views show grey, like the Subway map.
- With all toggles off, every view looks exactly as before.

**How and where to use:**

1. **Settings** → **Colors** → open **Plotline color scheme** → scroll below the HSL sliders to **Transfer plotline colors to**.
2. Switch on the views you want, e.g. **Navigator** and **Plot Grid**. Open views redraw at once.
3. To change a plotline's colour: **Plotlines** (list view) → colour picker on the plotline header, or the custom colours list in the same settings block. All switched-on views follow.

**Suggestion branch for upstream:** [`suggest-feature/colors-everywhere-matrix`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/colors-everywhere-matrix) ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/colors-everywhere-matrix)); there it also has a sixth toggle for the Subway map and Plotlines list.

**Files:**

- `utils/plotlineColor.ts` (new: colour resolver, built once per render)
- `settings.ts` (setting `plotlineColorViews`, toggle block)
- `views/PlotgridView.ts`, `views/TimelineView.ts`, `views/NavigatorView.ts`
- `components/Inspector.ts`, `components/InlineSuggest.ts` (optional pill colour), `components/Filters.ts`
- `styles.css` (fork section: filter chip dot, Navigator marker)

## 1.11.8-km.30

**Arc point links survive unticking, all chapters under a volume, plotline descriptions kept on rename, POV shown once on swimlane cards, Volumes editor on older devices**

- **Inspector, "Arc point":** unticking no longer deletes the `realizedBy` link (this reverses 1.11.8-km.22). The link stays in the frontmatter and is ignored while the scene is not an Arc Point: no dropdown, no Subway placement, not counted in off page statistics. Ticking "Arc point" again, or undoing the untick, brings the link back.
- **Board grouped by chapter, with a volume selected:** every defined chapter keeps its column, like in upstream StoryLine without volumes (this reverses the "only the chapters of the selected volume" rule of 1.11.8-km.20). A chapter has no act, so it cannot belong to a volume; a chapter whose scenes are all in other volumes shows as an empty column. "+" in such a column creates the scene in the volume's first act. Act columns still follow the volume.
- **Rename plotline onto an existing plotline:** the target plotline keeps its own description (shown in italics under the plotline header in the Plotlines list view). The renamed plotline's description is only carried over when the target has none. This bug is in upstream StoryLine too.
- **Timeline swimlane cards:** the POV character is no longer listed twice ("POV: Anna" and again among the characters), like on linear cards since 1.11.8-km.11. In "By POV" lanes the card has no "POV:" line and keeps the full character list.
- **Volumes editor on older devices:** on engines without CSS subgrid (before Chromium 117 / iOS 16), the volume rows stay on one line and the columns line up with the header. Newer devices are not affected.

**How and where to use:**

1. **Inspector** of an Arc Point scene → untick **Arc point** → tick it again (or undo): the **Realized** dropdown shows the previous scene again.
2. **Board** → Group by **Chapter** → pick a volume: all defined chapters are columns, also empty ones.
3. **Plotlines** (list view) → plotline header → right-click → **Rename plotline** → enter the name of an existing plotline: that plotline keeps its description.
4. **Timeline** → swimlanes, grouped by Location, Plotline or Tag: a card shows "POV: Anna" and then only the other characters.
5. **Manage story structure** → **Volumes** on an older iPad/iPhone or Android WebView: one line per volume.

**Suggestion branches for upstream:**

All changes of this fork are prepared as clean branches on top of upstream's `main`, each reviewed independently. Numbered branches build on each other. New since 1.11.8-km.29: `suggest-fix/timeline-pov-duplicate` and `suggest-fix/rename-plotline-description`; the changes above are also in `suggest-feature/realized`, `suggest-feature/volumes-01-core` and `suggest-feature/volumes-02-views`.

- [`suggest-fix/rename-tag-duplicates`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/rename-tag-duplicates): Renaming a plotline onto an existing tag no longer leaves the tag twice ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/rename-tag-duplicates))
- [`suggest-fix/timeline-pov-duplicate`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/timeline-pov-duplicate): Timeline cards no longer show the POV character twice ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/timeline-pov-duplicate))
- [`suggest-fix/rename-plotline-description`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/rename-plotline-description): Renaming a plotline onto an existing one keeps the target description ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/rename-plotline-description))
- [`suggest-fix/delete-plotline-count`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/delete-plotline-count): "Delete plotline" counts every scene that loses the tag ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/delete-plotline-count))
- [`suggest-fix/manuscript-pane-relief`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/manuscript-pane-relief): Manuscript stays visible with Pane Relief "Maximize active tab" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/manuscript-pane-relief))
- [`suggest-fix/plotgrid-keyboard-selection`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/plotgrid-keyboard-selection): Plot Grid keyboard selection follows the displayed rows ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/plotgrid-keyboard-selection))
- [`suggest-feature/export-include-arc-points`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/export-include-arc-points): Export option "Include arc points" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/export-include-arc-points))
- [`suggest-feature/structure-command`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/structure-command): "Manage story structure" command ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-command))
- [`suggest-feature/structure-collapsible-sections`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/structure-collapsible-sections): Collapsible sections in "Manage story structure" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-collapsible-sections))
- [`suggest-feature/arc-point-filter`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/arc-point-filter): Arc Point filter and badges in Timeline and Plot Grid ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/arc-point-filter))
- [`suggest-feature/pov-as-character`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/pov-as-character): POV character counts as a scene character ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/pov-as-character))
- [`suggest-feature/realized`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/realized): Arc Point linked to its scene (realizedBy) ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/realized))
- [`suggest-feature/offpage-01-zones`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/offpage-01-zones): On page / off page plotlines ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/offpage-01-zones))
- [`suggest-feature/offpage-02-stats`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/offpage-02-stats): Off page coverage in Statistics ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/offpage-02-stats))
- [`suggest-feature/volumes-01-core`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-01-core): Volumes model and Volumes editor ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-01-core))
- [`suggest-feature/volumes-02-views`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-02-views): One volume selection for all views ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-02-views))
- [`suggest-feature/volumes-03-bands`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-03-bands): Volume bands in the views ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-03-bands))
- [`suggest-feature/volumes-04-stats`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-04-stats): Statistics per volume ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-04-stats))
- [`suggest-feature/volumes-05-export`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-05-export): Export a single volume ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-05-export))
- [`suggest-feature/plotgrid-hide-empty-columns`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/plotgrid-hide-empty-columns): Plot Grid hides empty columns of a volume ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/plotgrid-hide-empty-columns))

**Files:**

- `components/Inspector.ts`, `components/RealizedByControl.ts`, `utils/arcRealization.ts` (realizedBy kept on untick)
- `views/BoardView.ts`, `utils/boardVolumes.ts` (all defined chapters under a volume)
- `views/StorylineView.ts` (rename keeps the target description)
- `views/TimelineView.ts` (POV once on swimlane cards)
- `styles.css` (Volumes editor fallback without subgrid)

## 1.11.8-km.29

**Volumes editor and volume statistics: layout fixes; list of the suggestion branches for upstream**

- **Volumes editor (Manage story structure → Volumes):**
    - The **Deadline** field is only as wide as the date needs; there is no empty space right of the year any more.
    - Header and rows share one grid, so the column titles (Title, From act, To act, Word goal, Deadline) always sit above their fields.
    - On phones the rows keep their layout and the list scrolls sideways. This was a rule in the owner's Style Settings snippet before; the plugin now does it itself.
    - Without volumes, "No volumes defined yet." uses the full width again.
- **Statistics, Volumes table:** on narrow panes the table no longer runs out of its frame. It scrolls sideways inside the frame, like the Character × Chapter heatmap of upstream.

**How and where to use:**

1. **Board** or **Timeline** → structure button → **Manage story structure** → section **Volumes**: the Deadline column fits the date; on a phone, swipe the volume rows sideways.
2. **Statistics** with volumes defined → **Volumes** table: in a narrow pane, scroll the table sideways inside its frame.

**Suggestion branches for upstream:**

Each change of this fork is prepared as a clean branch on top of upstream's `main` (no fork names, no fork files), reviewed independently, so Jan can merge it as is. Numbered branches build on each other.

- [`suggest-fix/rename-tag-duplicates`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/rename-tag-duplicates): Renaming a plotline onto an existing tag no longer leaves the tag twice ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/rename-tag-duplicates))
- [`suggest-fix/delete-plotline-count`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/delete-plotline-count): "Delete plotline" counts every scene that loses the tag ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/delete-plotline-count))
- [`suggest-fix/plotgrid-keyboard-selection`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/plotgrid-keyboard-selection): Plot Grid keyboard selection follows the displayed rows ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/plotgrid-keyboard-selection))
- [`suggest-fix/manuscript-pane-relief`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-fix/manuscript-pane-relief): Manuscript stays visible with Pane Relief "Maximize active tab" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/manuscript-pane-relief))
- [`suggest-feature/volumes-01-core`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-01-core): Volumes model and Volumes editor ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-01-core))
- [`suggest-feature/volumes-02-views`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-02-views): Shared volume selection in all views ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-02-views))
- [`suggest-feature/volumes-03-bands`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-03-bands): Volume bands in the views and volume badges ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-03-bands))
- [`suggest-feature/volumes-04-stats`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/volumes-04-stats): Statistics per volume ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-04-stats)) (in review)
- `suggest-feature/volumes-05-export`: Export of a single volume (planned, not built yet)
- [`suggest-feature/plotgrid-hide-empty-columns`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/plotgrid-hide-empty-columns): Plot Grid hides empty auto columns under a volume selection ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/plotgrid-hide-empty-columns))
- [`suggest-feature/arc-point-filter`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/arc-point-filter): Arc Point filter and badges in Timeline and Plot Grid ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/arc-point-filter))
- [`suggest-feature/realized`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/realized): Arc Point "realized by" link ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/realized))
- [`suggest-feature/offpage-01-zones`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/offpage-01-zones): On page / off page plotlines ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/offpage-01-zones))
- [`suggest-feature/offpage-02-stats`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/offpage-02-stats): Off page coverage in Statistics ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/offpage-02-stats))
- [`suggest-feature/pov-as-character`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/pov-as-character): POV character counts as a scene character ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/pov-as-character))
- [`suggest-feature/export-include-arc-points`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/export-include-arc-points): Export option "Include arc points" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/export-include-arc-points))
- [`suggest-feature/structure-collapsible-sections`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/structure-collapsible-sections): Collapsible sections in "Manage story structure" ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-collapsible-sections))
- [`suggest-feature/structure-command`](https://github.com/rk-kontur/obsidian-storyline/tree/suggest-feature/structure-command): "Manage story structure" command ([compare with upstream](https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-command))

**Files:**

- `styles.css` (Volumes editor grid and phone scrolling, Volumes table scroll container)
- `components/VolumeStatsSection.ts` (Volumes table wrapped in a scroll container)

## 1.11.8-km.28

**Corkboard: back to upstream behaviour**

- The Corkboard volume additions from 1.11.8-km.26 and 1.11.8-km.27 are removed again. The Corkboard behaves exactly as in upstream StoryLine, with and without a selected volume:
    - The camera no longer moves to the selected volume and is no longer remembered per volume.
    - Scenes without a stored position get upstream's initial grid position again.
- Reason: the Corkboard is a free-form canvas where cards are placed by hand. Placing new cards "below the volume's cards" mixes them into the next volume when volumes are stacked, and moving other cards out of the way would change positions the user set. The volume filter itself still applies to the Corkboard as before (cards of other volumes are hidden).
- The removed code is kept on branch `feature/corkboard-volume` and in the release `1.11.8-km.27`.

**How and where to use:**

1. **Board** → Corkboard mode: cards keep their positions; pan and zoom as in upstream.

**Files:**

- `views/BoardView.ts` (Corkboard volume hooks removed; identical to 1.11.8-km.25)
- `utils/corkboardVolume.ts` (removed)

## 1.11.8-km.27

**Review fixes: statistics links across volumes, volume selection at startup, volume chips, Corkboard for empty volumes, Pane Relief performance, safer Volumes editor, release workflow**

- **Statistics, Setup & Payoff Map:** with a volume selected, scenes of other volumes that are linked to the volume are shown with only their links into the volume. Before, their own links elsewhere showed up as false **Broken links** ("Z not found" although Z exists in another volume), and chains between two scenes outside the volume were shown and counted. The linked scenes now also keep the project's order, and building the list no longer slows down on large projects. The Setup/Payoff warnings are unchanged (they still match the warnings of the whole project, filtered to the volume).
- **Volume selection at startup:** if Obsidian indexes the project file only after the views were drawn (mobile, synced folders), the volume dropdown showed e.g. "Volume 2" but the views stayed unfiltered, and "Volume 2" could not be picked again. Now the views refresh as soon as the selected volume (or its acts) becomes known or changes.
- **Volume chips in the filter panel:** acts are matched by number, like everywhere else. A project that writes acts as `act: "05"` now gets its **Volume 2** chip, and with mixed spellings ("5" and "05") a volume chip selects all of them instead of silently leaving scenes out. The act chips are highlighted by their own value, not by their label (both "5" and "05" read "Act 5").
- **Corkboard, volume without scenes:** when the selected volume has no placed scenes yet, the board pans to the visible notes or scenes without an act. The first new scene of that volume is placed below all cards (as in 1.11.8-km.26), which was outside the view, and the camera did not follow because the volume had not changed. Now the board remembers that it only showed the notes: as soon as the volume has its own cards, the camera moves to them once, in the same refresh that places the first card. Plain refreshes still never move the camera, and the camera move writes nothing.
- **Manuscript with Pane Relief "Maximize":** the style rule that keeps the Manuscript and its scene editors visible now uses a fixed element path instead of a search through the whole Manuscript, so it no longer costs time on every keystroke while maximize is on (same kind of fix as upstream issue #105). The result is unchanged.
- **Volumes editor, data safety:**
	- If `volumes:` in the project file is not a list (e.g. a map or a text), the editor shows a hint and never replaces or deletes it; a change shows the notice "volumes: in the project file is not a list; edit it by hand".
	- A volume added in the dialog never takes over a file entry that got the same id meanwhile (added on another device or by sync, a hand-added entry without `id`, or a cache that was not up to date). That entry stays untouched and the new volume is saved with a fresh id. An entry without `id` that was added by hand is also never changed or removed in place of a volume of the dialog.
	- Writing the repaired volume ids (when the dialog opens) and saving changes now run strictly one after the other, so a slow first write cannot overwrite a change.
	- If a volume's entry in the file lost its `id` while the dialog is open (id line removed by hand, or a sync restored an older version), its changes cannot be saved safely: a notice says "Volume "X" changed in the file meanwhile; reopen the dialog." instead of dropping them silently. The same notice appears when such a volume is deleted in the dialog (the entry is then left in the file).
- **Release workflow:** feature versions (`x.y.z-km.N.<branch>.M`) get their changelog section as release text and are published as **pre-releases**, so BRAT does not offer them to everyone. The "changes since the previous release" link and patch now use the previous `km/base` release in the history (not the newest tag by date, and never a feature tag). Release runs no longer run in parallel (GitHub keeps only one waiting run, so release one version at a time).

**How and where to use:**

1. **Statistics:** define volumes, link a scene of Volume 1 (`payoff_scenes`) to a scene of Volume 2 that has its own links to Volume 3. Open **Statistics**, pick **Volume 1** and open **Setup & Payoff Map**: no false broken links, and only links that touch Volume 1 are shown.
2. **Startup:** select a volume, restart Obsidian (or open the vault on mobile). As soon as the project file is indexed, all open views show only that volume.
3. **Volume chips:** with acts written as `"05"`, open the filter panel (filter button "Show/hide filters" in the filter bar of the Board): the **Volume** row shows the chip for the volume of act 5; clicking it highlights every matching **Act** chip.
4. **Corkboard:** open the **Board** in **Corkboard** mode, pick a volume that has no scenes yet (only notes are visible), and create a scene in it: the card is placed below all cards, and the board moves to it once.
5. **Pane Relief:** with Pane Relief installed, maximize a scene editor inside the **Manuscript**: everything stays visible as before, typing stays smooth in long manuscripts.
6. **Volumes editor:** open **Manage story structure** → **Volumes**. With `volumes:` written as a map, the tab shows the hint and the file is left alone. Adding volumes while another device adds one keeps both.
7. **Release workflow:** only relevant when releasing a feature branch version; it appears as a pre-release on GitHub.

**Files:**

- `utils/volumeStatsScope.ts` (withLinkPartners)
- `utils/volumeScope.ts` (registerVolumeScopeSync, syncVolumeScopeSelects)
- `components/VolumeFilterChips.ts`
- `utils/corkboardVolume.ts` (camera moves once to a volume's first own card after a fallback pan)
- `styles.css` (fork section: Pane Relief rule)
- `components/VolumesEditor.ts`
- `.github/scripts/km-release-notes.js`
- `.github/workflows/release-km.yml`
- `CHANGELOG-km.md`

## 1.11.8-km.26

**Corkboard follows the selected volume: camera per volume, new scenes placed next to their volume**

- When you select a volume, the **Corkboard** hides the cards of the other volumes, but the camera stayed where it was. Later volumes sat far away and you had to pan a long way to find them.
- Now the camera moves to the volume: at the current zoom, the top-left corner of the area around the volume's cards sits just inside the top-left corner of the board. Only scenes whose act belongs to the volume count; corkboard notes and scenes without an act (they are shown in every volume) do not. If the volume has no placed scenes yet, all visible cards are used.
- The camera is remembered per volume for the current project while the board is open: switching back to a volume, or to **All volumes**, returns to where you were there. Without a remembered camera, **All volumes** keeps the current camera as before.
- Only the camera moves. No card position is changed or saved, and the **All volumes** layout stays as it is.
- New scenes that have no corkboard position yet used to land near the top-left of the whole board when a volume was selected, on top of Volume 1's cards in **All volumes**. With a volume selected they are now placed in a grid one row below the volume's lowest card (below all cards if the volume has none yet).
- Projects without volumes behave exactly as before, and **All volumes** places new scenes exactly as before.

- New cards never land on a stored card: cells that overlap any card (of another volume, a note or a scene without an act) or a cell handed out before are skipped.

**How and where to use:**

1. Open the **Board** and switch it to **Corkboard** mode.
2. In the filter bar, pick a volume in **Filter by [Volume]**: the board pans to that volume's cards.
3. Pan and zoom as you like, pick another volume, then pick the first one again: you are back where you left it. **All volumes** also returns to its own view.
4. Create a new scene while a volume is selected: on the Corkboard it appears below that volume's cards, not at the top-left of the board.

**Files:**

- `utils/corkboardVolume.ts` (new: camera per volume, volume bounding box, grid for new scenes)
- `views/BoardView.ts` (corkboard render: two marked hooks)
- `CHANGELOG-km.md`

## 1.11.8-km.25

**Manuscript with Pane Relief "Maximize active tab": no blank page, no scroll jump**

- With Pane Relief's **Maximize active tab** on, clicking into a scene in the **Manuscript** could blank the page, and scrolling jumped back to the top after a short way.
- Cause: the Manuscript shows each scene in a real Obsidian editor (a workspace split and leaf inside the view). Pane Relief treats those like tabs: its maximize rules hide every leaf and split that is not the maximized one. So the scene editors could be hidden, and when a scene editor became the active leaf (a click into it, or an editor loading while you scroll), Pane Relief hid the Manuscript itself. Hiding and re-showing the view made the page and its scroll position jump.
- The earlier workaround (1.12.0-km.12) handed the maximized state back to the Manuscript after each such switch. That hid and showed the view again every time, which caused the scroll jump, and it took the active editor away from the scene you clicked.
- Now a few CSS rules keep the Manuscript and all of its scene editors visible while Pane Relief maximizes, and hide the scene editors' file header bar there as usual. The hand-back is removed, so the scene you click stays the active editor and editor commands and the formatting toolbar work on it. Without Pane Relief, or with maximize off, the rules do not apply.

**How and where to use:**

1. With Pane Relief installed, turn on **Maximize active tab** (Pane Relief command "Maximize active tab (Toggle)").
2. Open the **Manuscript**, scroll down, click into a scene and type: the page and the scroll position stay.
3. Scroll through a long manuscript: it no longer jumps back to the top while scenes load.

**Files:**

- `views/ManuscriptView.ts` (hand-back to the Manuscript removed)
- `utils/paneReliefCompat.ts` (removed)
- `styles.css` (fork section: Pane Relief maximize rules for the Manuscript)

## 1.11.8-km.24

**Subway map and Plot Grid: volume bands end before Prologue / Epilogue / "No Act", readable act labels in narrow acts; one shared link rule, code cleanup**

### Subway map: the volume line also ends a volume

- In the Subway map, the solid volume line was only drawn where a volume starts. The Epilogue and acts outside every volume after the last volume act looked like part of that volume. This also applied to scenes without an act and non-numeric acts (e.g. "Part 5"): the Subway map places their columns at the end, after the last volume. A solid line (the same line as at the start of a volume, without a label) now also separates all of them from the preceding volume; a later act of a volume starts its volume again (same rule as the Timeline, Board, Manuscript and Navigator). The lines follow the order of the scene columns; act grouping and act labels stay as upstream draws them, and without volumes the map is unchanged.

### Subway map: act labels no longer run into each other

- Act labels with the volume title ("VOLUME 1 ACT 1") could be wider than an act with only one scene column and overlap the labels of the neighbouring acts. If a label does not fit the width of its act, the volume title now moves onto its own line above the act label. A line that still does not fit (a very long volume title) is shortened with "…"; hovering the label shows the full text. Labels that fit are unchanged (one line, as before).

### Plot Grid: volume bands end before Prologue / Epilogue / "No Act"

- In the Plot Grid, the Epilogue, acts outside every volume and scene rows without an act were shown inside the band of the preceding volume. A thin unlabelled separator row now ends the volume band before them; a later act of a volume starts its labelled band again. Without volumes, nothing changes.

### Internal

- Characters (including POV) and Arc Point `realizedBy` use one shared link rule (`utils/linkKey.ts`: `linkpathOf`, `linkName`, `linkKey`) instead of two slightly different copies. A wikilink names its target (the alias is display text), `#heading` inside a link, folders and `.md` are dropped; in a plain value "|" and "#" are part of the name. Characters compare case-insensitively, as before. For the values the scene parser delivers, the result is the same as before, except one fix: a plain character value containing "|" was cut at the "|". For raw values (character filter, `realizedBy` fallback) "#heading" and Windows "\\" folders are now stripped as well.
- Setup/payoff links (open setups per volume in Statistics, cross-volume link partners for the Setup & Payoff map and the Validator) no longer use their own normalizers: they match the parsed link value against the scene title exactly as upstream's Validator does (the parser already cleans the links). So a payoff the Validator reports as missing is also "missing" in the open setups, and vice versa; before, the fork's own cleanup could disagree for titles containing "|" or ending in ".md".
- `drawSubwayVolumeMarker`: unused title parameters and text branch removed.
- Removed unused `inVolumeScope` and `volumeScopeSelectCount` (`utils/volumeScope.ts`).
- Lint: "Arc Point" tooltip keeps its name (targeted `eslint-disable` with reason). All fork files and the fork lines of upstream files pass `eslint`.
- File headers updated: `components/VolumesEditor.ts` (a section, no longer a tab), `utils/volumeScope.ts` (complete list of views that follow the volume selection), `utils/sceneCharacters.ts`, `utils/volumeSetups.ts`.

**How and where to use:**

1. Use a project with volumes, e.g. Volume 1 = acts 1–2, Volume 2 = act 4, plus act 3, an Epilogue and some scenes without an act. Select **All volumes** in the **Filter by** dropdown.
2. Open the **Subway map** (plotline view, Subway mode): a solid line separates Volume 1 from act 3, Volume 2 from the Epilogue. Between acts of the same volume the dashed act line is shown as before.
3. Give a volume a long title (e.g. "Volume One: Arrival") and an act with a single scene: the act label shows the volume title on its own line above "ACT 1". If it is still too wide it ends with "…"; hover it to read the full label.
4. Open the **Plot Grid** with sort **Sequence** (the default) or **Act**: a thin line ends the volume band before act 3, the Epilogue and the rows of scenes without an act; Volume 2 starts with its labelled band again.

**Files:**

- `views/StorylineView.ts` (`renderSubway`: volume lines decided in column order with `VolumeDividerTracker` `{ bandEnd: true }`, also at the band end; act label via `setSubwayActLabel`)
- `views/PlotgridView.ts` (`renderGrid`: volume steps computed once in the row-track loop (`kmVolumeSteps`, incl. band end before visible rows without act), drawn from the same map)
- `utils/volumes.ts` (`drawSubwayVolumeMarker` simplified; `setSubwayActLabel` (new); `renderVolumeStep` (new, used by `VolumeDividerTracker`))
- `utils/linkKey.ts` (new: `linkpathOf`, `linkName`, `linkKey`)
- `utils/arcRealization.ts` (`linkpathOf` moved to `utils/linkKey.ts`; `resolveRealizingScene` fallback uses `linkName`)
- `utils/sceneCharacters.ts` (`characterKey` replaced by `linkKey`; header)
- `utils/volumeSetups.ts` (`computeOpenSetups`: own `linkTitle` removed, exact Validator match; header)
- `utils/volumeStatsScope.ts` (`withLinkPartners`: own normalization removed, exact Validator match, link set built once per scene)
- `utils/volumeScope.ts` (unused `inVolumeScope`, `volumeScopeSelectCount` removed; header)
- `components/VolumeScopeNotes.ts`, `views/TimelineView.ts` (`linkKey` instead of `characterKey`)
- `components/RealizedByControl.ts` (`linkpathOf` from `utils/linkKey.ts`)
- `components/ArcPointUI.ts` (`renderArcPointIcon`: lint comment)
- `components/VolumesEditor.ts` (header)
- `CHANGELOG-km.md`

## 1.11.8-km.23

**Navigator with volumes: progress, plotline and chapter lists of the selected volume, volume band ends before Prologue / Epilogue / "No Act"**

### Progress bar shows the selected volume

- With a volume selected in the shared volume dropdown, the progress bar at the bottom of the Navigator showed the progress of the whole project. It now shows the selected volume: the same computation as before (words or characters, depending on the setting **Count unit for scene lengths**, against the sum of the scenes' word targets, or the word count and number of scenes when no targets are set), over the volume's own scenes. Like the **Statistics** view, scenes without an act are not counted for a volume.
- The label starts with the volume title, e.g. "Volume 2 · 12.3k / 40.0k (31%)", and hovering the bar shows "Progress of Volume 2". With **All volumes** (or without volumes) the progress bar is unchanged.

### Plotline and chapter lists follow the volume

- **Plotlines** and **Chapters** above the scene list listed every plotline and chapter of the project, with project-wide counts. With a volume selected, they now list only the plotlines and chapters that occur in the volume's scenes (scenes of the volume's acts plus scenes without an act, the same scenes the list shows), and the counts are the counts in the volume. Plotline colours stay the same as with **All volumes**.
- An active plotline or chapter filter is kept when the volume changes, also if that plotline or chapter does not occur in the new volume. It then stays in the list, marked "not in Volume 2" (click it to clear the filter), and the scene list says why it is empty, e.g. "No matching scenes: plotline "Love" does not occur in Volume 2", instead of an unexplained empty list. Upstream keeps such a filter as well; without a volume the behaviour is unchanged.

### Volume bands end before scenes outside every volume

- In **Reading order (by act)**, the Prologue, Epilogue, "Ungrouped" scenes (no act), non-numeric acts and acts that belong to no volume were shown inside the band of the preceding volume. A thin unlabelled separator now ends the volume band before them; a later act of a volume starts its labelled band again (same rule as the Timeline, Board and Manuscript). The other sort modes show no volume bands, as before.

### Performance

- The volume selection is read once per render of the Navigator, not once per scene, also while typing in **Filter scenes…**.

- The Navigator's progress keeps upstream's rule: it measures against the scenes' word targets and counts Arc Point scenes. Statistics uses the volume's word goal and may leave Arc Points out, so the two can show different numbers for the same volume.

**How and where to use:**

1. Open the **Navigator** (compass icon, or command "Open navigator") in a project with volumes, e.g. Volume 1 = acts 1–2, Volume 2 = acts 3–4.
2. Select **Volume 2** in the volume dropdown in the Navigator's toolbar (next to the search field), or in the **Filter by** dropdown of any other view.
3. Look at the progress bar at the bottom: the label starts with "Volume 2" and shows only that volume's words and targets. Select **All volumes**: the project-wide progress is shown again, without a volume title.
4. Expand **Plotlines** and **Chapters**: only the plotlines and chapters of Volume 2 are listed, with their counts in Volume 2.
5. Select a plotline that occurs only in Volume 1 while **All volumes** is selected, then switch to **Volume 2**: the plotline stays selected and is listed as "not in Volume 2", and the scene list explains why it is empty. Click the plotline (or **All**) to clear the filter.
6. With **All volumes** and sort **Reading order (by act)**, scroll to the Epilogue or the "Ungrouped" scenes: a thin line ends the last volume band before them.

**Files:**

- `views/NavigatorView.ts` (`refresh`: volume scope resolved once and passed on; `renderChips` / `renderChapterFilter`: volume lists and counts, row for an active filter outside the volume (`kmRenderOutsideRow`, new); `renderList`: scope passed in, empty-list message (`kmEmptyMessage`, new); `renderGroupedByAct`: `VolumeDividerTracker` with `{ bandEnd: true }`; `renderProgress`: statistics over the volume's scenes, volume label and tooltip)
- `utils/navigatorVolume.ts` (new: `resolveNavigatorScope`, `collectTagChips`, `collectChapterChips`, `filterOutsideVolume`, `outsideVolumeHint`, `emptyListMessage`, `volumeProgressLabel`, `volumeProgressTooltip`)
- `CHANGELOG-km.md`

## 1.11.8-km.22

**Arc Points and export: orphaned `realizedBy` removed, export preselects the current volume and names the file after it, new "Include arc points" option**

### Unchecking "Arc point" also removes `realizedBy`

- When **Arc point** is unchecked in the Inspector, the scene's `realizedBy` (also the `realized_by` spelling) is now removed from its frontmatter as well. Before, the link stayed behind as an orphan on a regular scene. No other frontmatter key is touched.
- The link is only removed when the scene is really no longer an Arc Point after the write. A scene that uses the old spelling `arc_anchor: true` stays an Arc Point when unchecked (upstream only removes `arcAnchor`), so its `realizedBy` is kept as well.
- Undo of the Arc point change restores `arcAnchor` only, not the removed `realizedBy` (upstream undo does not know this key).

### Export dialog preselects the current volume

- With a volume selected in the views (the shared **Filter by** volume dropdown), **Export project** opens with that volume in its **Volume** dropdown. You can still pick another volume or **All volumes**. Without a selected volume, or if the selected volume no longer exists, it opens with **All volumes**, as before.

### Volume exports are named after the volume

- A volume export was named "My Book - Manuscript - Acts 5,6,7,8,... (date)". It is now named after the volume: "My Book - Manuscript - Volume 2 (date)". The title is made safe for file names with upstream's rule for act folders (characters `\ / : * ? " < > |` become "-", no trailing dots or spaces). Exports without a volume, and **Scenes** / **Chapters** range exports, keep upstream's names.
- If two volumes have the same title after this cleanup (e.g. "Part: 1" and "Part- 1", or titles that differ only in case), the volume id is added, e.g. "My Book - Manuscript - Part- 1 (v2) (date)", so the second export of the day does not overwrite the first.

### New export option "Include arc points"

- Arc Points are planning notes, not manuscript text. The new toggle **Include arc points** in the Export dialog decides whether scenes marked as Arc Point are exported. It is **on by default**, which is today's behaviour (the export always included Arc Points).
- It applies to every content type (Manuscript, Chapters, Scenes, Outline) and every format (Markdown, Word, PDF, HTML, CSV, JSON), because all of them take their scenes from the same list.
- Like the other include toggles of the dialog (corkboard notes, inactive scenes), the choice is not remembered: the dialog always opens with the toggle on.

<!-- screenshot: Export dialog with Volume preselected (e.g. "Volume 2") and the new "Include arc points" toggle below "Include inactive scenes" -->

### `realizedBy` and renamed scenes (behaviour, no change)

- `realizedBy` is a normal frontmatter link. It follows a renamed scene whenever Obsidian updates links: automatically with **Settings → Files and links → Automatically update internal links** on, or after **Update** in Obsidian's "Update links?" prompt when the setting is off.
- If the links are not updated ("Don't update"), the fork does not override that choice. The Arc Point still finds its scene through the existing fallback by equal title or file name (e.g. when only the file was renamed and the scene's title still matches the link); otherwise the **Realized** dropdown shows the old link as "(not found)".

**How and where to use:**

1. Open a scene that is an Arc Point and has **Realized** set to a scene in the **Inspector**. Uncheck **Arc point**: the **Realized** dropdown disappears and `realizedBy` is gone from the scene's frontmatter (check in Source mode or the Properties panel).
2. Select a volume, e.g. **Volume 2**, in the **Filter by** dropdown of the Board, Timeline or Manuscript. Open **Export project** (**Export** button in the view switcher, or command "Export project"): the **Volume** dropdown already shows **Volume 2**.
3. Click **Export**: the file in the project's `Exports` folder is named "<project> - Manuscript - Volume 2 (<date>).<ext>". Choose **All volumes** to get the upstream name again.
4. In the same dialog, switch **Include arc points** off and click **Export**: the export contains no Arc Point scenes. Switch it on (default) to include them.

**Files:**

- `components/Inspector.ts` (Arc point toggle: calls `clearRealizedBy` when the re-parsed scene is no longer an Arc Point)
- `components/RealizedByControl.ts` (`clearRealizedBy` (new); lint fixes in `renderRealizedByControl`, no behaviour change)
- `components/ExportModal.ts` (`onOpen`: volume preselected from `getScopedVolume`, toggle **Include arc points**, `includeArcPoints` and `volumeTitle` (from `volumeExportTitle`) passed to the export)
- `services/ExportService.ts` (`ExportOptions.includeArcPoints` / `volumeTitle`, `getSortedScenes`: Arc Point filter, `getExportLabel`: volume title)
- `utils/exportFork.ts` (new: `volumeExportTitle`, `volumeExportLabel`, `filterArcPointsForExport`)
- `CHANGELOG-km.md`

## 1.11.8-km.21

**Manuscript with volumes: scene list follows changed volume acts, focus mode hides volume controls, volume band ends before Prologue / Epilogue / "No Act"**

### The scene list follows changes to the selected volume's acts

- With a volume selected, the Manuscript cached its scene list by the volume id only. After changing the volume's `acts:` in the project file (e.g. Volume 2 from acts 5–6 to 5–7), the Manuscript kept showing the old scenes. The cache now also depends on the volume's resolved acts (numeric, without 0 / 99) and on the act values the volume filter matches (including spellings such as "05"), so the list is rebuilt when any of them changes.

### Focus mode hides the volume dropdown and the volume bands

- Focus mode in the Manuscript hides act and chapter dividers and most of the toolbar, but the fork's "Filter by [Volume]" dropdown and the volume bands stayed visible. They are now hidden in focus mode in the same way as upstream's act dividers, including the volume band end separators.

### Volume bands end before scenes outside every volume

- In the Manuscript, the **Prologue**, **Epilogue**, scenes without an act ("No Act"), non-numeric acts and acts that belong to no volume looked as if they were part of the preceding volume. A narrow, unlabelled separator now ends the volume band before the first such scene; a later act of a volume starts its labelled band again (same rule as the Timeline and the Board).
- Volume membership follows the numeric act rule used everywhere else: act "05" is act 5, act 0 (Prologue) and 99 (Epilogue) belong to no volume. With a volume selected, the Manuscript shows the scenes of that volume's acts plus scenes without an act, as the other views do.

<!-- screenshot: Manuscript, All volumes: Volume 1 band, end separator before act 3 (outside every volume), Volume 2 band, end separator before the Epilogue -->

- With a sort that ignores the structure (e.g. by title), scenes without an act do not close the volume band, so act and volume headings are not repeated more than upstream already repeats act dividers in that order.

**How and where to use:**

1. Open the **Manuscript** in a project with volumes (e.g. Volume 1 = acts 1–2, Volume 2 = acts 5–6) and select **All volumes** in the **Filter by** dropdown.
2. Scroll through the manuscript: the labelled band "Volume 1" is shown before act 1, "Volume 2" before act 5. A thin unlabelled line ends the band before the first act outside every volume, the **Epilogue** or the first scene without an act.
3. Select **Volume 2** in the **Filter by** dropdown. Then change `acts:` of Volume 2 in the project file (e.g. to `5-7`): the Manuscript now also shows the scenes of act 7 (including scenes with act "07").
4. Click the **Focus mode** button (glasses icon) in the filter bar: the **Filter by** dropdown and all volume bands are hidden together with the act and chapter dividers. Click it again to show them.

**Files:**

- `views/ManuscriptView.ts` (`computeFilterKey`: volume acts in the cache key; `renderManuscript`: `VolumeDividerTracker` with `bandEnd`, band end before scenes without an act)
- `utils/volumeScope.ts` (`volumeScopeFilterKey` (new))
- `styles.css` (fork section: focus mode hides `.sl-km-filter-by` and `.sl-km-volume-divider`)
- `CHANGELOG-km.md`

## 1.11.8-km.20

**Board with volumes: "+" respects the column, chapters of the selected volume only, volume band ends before the Prologue / Epilogue / "No Act"**

### "+ add scene" creates the scene in the column you clicked

- With a volume selected and the Board (Kanban) grouped by **Act**, "+ add scene" in the **No Act** column created the scene in the first act of the volume (e.g. act 5). Now the column decides: **No Act** creates a scene without act, an **Act N** column keeps act N, as before. Columns of acts 100 and above, which are labelled without "Act" (e.g. "100"), now also get their act when it belongs to the selected volume. The **Prologue** and **Epilogue** columns are not shown while a volume is selected, because they belong to no volume.
- Without a selected volume nothing changes: as in upstream, "+ add scene" in the **Prologue** / **Epilogue** column opens the dialog with act "None" (the `^Act\s+` column match does not cover these columns). This looks like an upstream bug and is a candidate for an upstream fix (prefill act 0 / 99).
- Grouped by **Chapter** with a volume selected, "+" in a chapter column uses the act of that chapter inside the volume (from the volume's scenes with this chapter). If the chapter has no act or several acts in the volume, the volume's first act is used, so the new scene stays visible. Without a selected volume the act is inferred as before.
- The toolbar button "+ new scene" and the columns of the other groupings (**Status**, **POV**, **No Chapter**, ...) keep using the volume's first act while a volume is selected.

### Grouped by chapter: only the chapters of the selected volume

- With a volume selected and grouping **Chapter**, every defined chapter of the project appeared as an empty column, also chapters of other volumes. Now, with a volume selected, a chapter column is shown only if it has visible scenes (scenes of the volume's acts, or scenes without act, which are visible in every volume) or if a scene with an act of the volume has this chapter. A chapter that is only defined in the project, without such a scene, appears under **All volumes** only.

### Volume bands end before columns outside every volume

- In the Kanban grouped by **Act**, the **Prologue**, **Epilogue**, **No Act**, non-numeric acts and acts that belong to no volume looked as if they were part of the last volume. A single narrow, unlabelled separator now ends the volume before the first such column (the following columns outside every volume share it); a later act column of a volume starts its labelled band again (same rule as the Timeline band end in 1.11.8-km.19).
- A column is assigned to a volume by the same numeric act rule as the "V2" card badges and the volume filter: "Act 5" (also for act "05") is act 5, act 0 / 99 belong to no volume, and columns such as "Part 5" are no longer read as act 5.
- On touch devices, dropping a card onto another card now reorders within the scenes of the selected volume, as with the mouse.
- The Corkboard has no act columns or bands and is unchanged; its cards keep their "V2" badges.

<!-- screenshot: Board (Kanban, grouped by Act), All volumes: Volume 1 and Volume 2 bands, end separator before Epilogue / Prologue / No Act -->
<!-- screenshot: Board (Kanban, grouped by Chapter), Volume 2 selected: only chapters of Volume 2 -->
<!-- screenshot: Volume 2 selected, quick add dialog opened from the No Act column with act "None" -->

**How and where to use:**

1. Open the **Board** in **Kanban** mode in a project with volumes (e.g. Volume 1 = acts 1–4, Volume 2 = acts 5–8) and set **Group by** to **Act**.
2. With **All volumes** selected, look at the columns: the labelled band "Volume 1" before act 1, "Volume 2" before act 5, and one narrow separator without label after the last column of a volume, before the first column outside every volume (an act outside every volume, **Epilogue**, **Prologue** or **No Act**). The columns that follow it share this one separator until a column of a volume starts the next labelled band.
3. Select **Volume 2** in the volume dropdown. Click **+ add scene** in the **No Act** column (shown when there are scenes without an act): the dialog opens with act **None**. In the **Act 6** column it opens with **Act 6**. The **Prologue** and **Epilogue** columns are hidden while a volume is selected. The toolbar button **+ new scene** opens it with **Act 5**.
4. Set **Group by** to **Chapter**: only chapters with scenes in acts 5–8 (or with scenes without an act) have columns. Click **+ add scene** in a chapter column: the act of that chapter in Volume 2 is preselected.
5. Select **All volumes**: all defined chapters are shown again.

**Files:**

- `utils/boardVolumes.ts` (new: `boardQuickAddAct`, `inferVolumeActForChapter`, `scopeDefinedChapters`)
- `views/BoardView.ts` (`renderBoard`: defined chapters of the volume, band end before columns outside every volume; `openQuickAdd`: act from the column or the volume; touch drop on a card: volume scope)
- `utils/volumes.ts` (`VolumeDividerTracker`: `advance`, `renderColumnBefore` (new); `actFromColumnKey`: only "Act N", plain numbers, Prologue, Epilogue)
- `styles.css` (fork section: `.sl-km-volume-column.sl-km-volume-end`)
- `CHANGELOG-km.md`

## 1.11.8-km.19

**Timeline with volumes: empty acts in their volume, empty volumes visible, bands only in Reading order**

### The Arc Point filter no longer turns acts into "empty" acts

- With **Arc Points** or **Scenes only** selected in the Arc Point filter, every act without a matching scene appeared at the end as "No scenes in Act 3 · Click + to add a scene", although the act has scenes.
- An act now counts as empty only when it has no scene at all in the selected volume, exactly as the Timeline decides it without the fork (active scenes, corkboard notes not counted). The Arc Point filter only hides scenes; acts whose scenes are all hidden by it are left out.
- If the filter hides every scene, the Timeline says "No scenes match the current filter." (single column and **Swimlane**), also when empty-act placeholders follow or no scene has a numeric act.

### Empty acts sit in their place, inside their volume band

- In **Reading order** in a project with volumes, a defined act without scenes is shown between its neighbouring acts, inside the band of its volume, instead of after the last volume. Text and **+** button are unchanged.
- Without volumes, and in **Chronological order**, empty acts stay at the end, as before.

### Volumes without scenes are visible

- In **Reading order** with **All volumes**, a volume without any scene gets its band at its place among the acts. If it has defined acts, they are shown as empty acts below the band; otherwise a card "No scenes in Volume 3" follows. Clicking the card adds a scene to the volume's first act.
- With a volume selected that has no scenes, the Timeline shows that card (with the volume band in Reading order) instead of "No scenes found.". The same applies in **Swimlane** mode.

<!-- screenshot: Timeline, Reading order, All volumes, band "Volume 3" with the card "No scenes in Volume 3" -->
<!-- screenshot: Timeline, Arc Points filter, an empty act inside the Volume 2 band -->
<!-- screenshot: Timeline, Reading order, band end line before the Epilogue -->

### Volume bands only in Reading order

- Volume bands only make sense when the acts follow each other. In **Chronological order** scenes of different acts and volumes interleave, so the Timeline (single column and **Swimlane**) no longer shows volume bands there; before, a band was repeated every time the volume changed. In **Reading order** both modes show the bands as before.
- In Swimlane mode empty acts are not shown (as without the fork), so a volume without scenes only appears when it is selected.

### Volume bands end before acts outside every volume

- The Prologue (act 0), the Epilogue (act 99), "No Act", non-numeric acts and acts that belong to no volume were drawn inside the band of the last volume. In the Timeline (single column and **Swimlane**, Reading order) such an act after a volume now ends the band with a plain separator line without label. A later act of a volume starts that volume's band again. An empty Epilogue placeholder also comes after the band end.
- The other views keep their bands as before.

**How and where to use:**

1. Open the **Timeline** of a project with volumes (e.g. Volume 1 = acts 1–2, Volume 2 = acts 3–4, Volume 3 = acts 5–6) and select **Reading order**.
2. Set the Arc Point filter in the toolbar to **Arc Points**: only acts with Arc Points are shown, no "No scenes in Act …" placeholders for acts that have scenes. Set it to **Scenes only** and back to **All**.
3. Define an act without scenes (structure button, e.g. act 4): its "No scenes in Act 4" placeholder appears after act 3, inside the **Volume 2** band. Click **+** or the card to add a scene to act 4.
4. With **All volumes** selected and no scenes in acts 5–6, the **Volume 3** band appears after Volume 2 with the card "No scenes in Volume 3". Click the card to add a scene to act 5.
5. Select **Volume 3** in the volume dropdown: the band and the card are shown instead of an empty view. Switch on **Swimlane**: the same card is shown.
6. Add a scene with act 7 (outside every volume) or an Epilogue scene: after the last volume's scenes a separator line ends the band, and act 7 / the Epilogue follow below it.
7. Switch to **Chronological order**: no volume bands are shown, empty acts are listed at the end.

**Files:**

- `views/TimelineView.ts` (`renderTimeline`: empty acts from the unfiltered, volume-scoped list, empty volumes, placement in act order, empty state for a fully filtered list, bands only in Reading order with band end, filter hint, drop indicators skip placeholders; `renderSwimlaneTimeline`: bands only in Reading order with band end, empty selected volume, filter hint; `kmBaseSceneActs`, `kmRenderEmptyScopedVolume`, `kmRenderFilterHint` (new))
- `utils/timelineVolumes.ts` (new: `emptyTimelineActs`, `emptyTimelineVolumes`, `firstVolumeAct`, `mergeByAct`, `renderEmptyVolumeEntry`)
- `utils/volumes.ts` (`VolumeDividerTracker`: opt-in band end in `renderBefore`, `renderVolume` (new))
- `styles.css` (fork section: `.sl-km-volume-divider.sl-km-volume-end`)
- `CHANGELOG-km.md`

## 1.11.8-km.18

**Plot Grid with volumes: inactive scenes stay, keyboard skips hidden rows and columns, sticky band follows the setting**

### Inactive scenes are no longer hidden by a volume selection

- An inactive scene in act 6 was shown under **All volumes**, but disappeared under **Volume 2**, although act 6 belongs to Volume 2. The volume selection used the default filter "active scenes only".
- A volume selection on its own now hides only the rows of other volumes. Inactive scenes of the volume stay visible, as without a volume selection.
- Filters you set in the filter bar (**All**, **Inactive**, a status, …) work as before. With only the default **Active** button and no other filter, the Plot Grid shows all rows, inactive ones included, as it always did without a volume selection; this now also holds under a volume selection.

### Hidden empty columns can no longer be reached or open up

- **Arrow keys** and **Tab** / **Shift+Tab** on a selected cell skip hidden empty columns, in both directions; at the first and last visible column the selection stays. Before, the selection could land in an invisible cell, and **Enter** opened the editor there.
- **Tab** / **Shift+Tab** while editing a cell also skip them. Only while editing, Tab at the end of a row continues in the first visible cell of the next shown row, and Shift+Tab at the start of a row in the last visible cell of the previous shown row.
- The first arrow key press without a selection starts at the first shown row and the first visible column. If every column is hidden, nothing is selected. **Enter** never opens the editor in a cell that is not shown.
- **↑** / **↓** move through the rows as they are shown: in the shown order (also when the grid is sorted), skipping rows of other volumes, rows hidden by a filter and rows of collapsed acts or chapters. Before, the selection got stuck on a row that was not shown, or jumped in the order of the data instead of the shown order. At the first and last shown row the selection stays, as before.
- A selected cell whose column becomes hidden, or whose row is no longer shown (switching the volume, collapsing an act or chapter, a filter), is deselected. Before, the arrow keys and Tab did nothing until you clicked a cell again.
- The highlighted row header is the one of the selected row. Before, under a volume selection, a filter, a sort or a collapsed section, another row header could be highlighted (also the header that flashes after **Bold**, **Italic** or colour changes, and the header coloured by **Set row colour** / **Set header colour**).
- **Dragging a column border** (or the border of the label column) keeps the hidden columns collapsed. Before, all of them opened up as empty gaps while dragging.
- **Zooming** keeps the grid as wide as the visible columns. Before, the canvas became too wide after zooming.

### The volume band follows "Sticky headers"

- The volume band in the Plot Grid was always sticky. It now sticks to the left edge only when **Sticky headers** is on, like the row headers and act dividers.

### Accurate hint text

- The hint at the right of the filter bar said "N empty plotlines hidden", but it also hides empty character, location and codex columns. It now names what is hidden: "2 empty plotlines hidden · show" when all hidden columns are of one kind, else "5 empty columns hidden (3 plotlines, 2 characters) · show". The toggle reads **Hide empty columns**.

**How and where to use:**

1. Open the **Plot Grid** of a project with volumes (e.g. Volume 2 = acts 5–8) and columns from **Sync from scenes**.
2. Mark a scene in act 6 as inactive. Select **All volumes**, then **Volume 2** in the volume dropdown: the scene's row is visible in both cases. Click **Inactive** in the filter bar: only inactive scenes of Volume 2 are shown. Add a status filter: inactive scenes are hidden, as without a volume selection.
3. With **Volume 2** selected, click a cell left of a hidden empty column and press **→**: the selection jumps over the hidden column. Press **←**, **Tab** and **Shift+Tab** at the first and last visible column: the selection never lands in a hidden column. Press **Enter**: the editor opens in the selected, visible cell. While editing, press **Tab** in the last visible cell of a row: editing continues in the first visible cell of the next shown row.
4. Collapse an act divider and sort the grid (sort dropdown), then press **↓** and **↑** repeatedly: the selection moves row by row in the shown order, jumps over the collapsed act, and stops at the first and last shown row. The highlighted row header always matches the selected row. Collapse the act of the selected row: the selection is cleared, and the next arrow key press starts at the first shown row.
5. Drag the right border of a column header: no gaps open up. Zoom in and out with the zoom buttons: the grid ends at the last visible column.
6. Turn off **Sticky headers** (pin button in the toolbar, or the header context menu) and scroll right: the volume band scrolls with the grid. Turn it on again: the band stays at the left edge.
7. Look at the hint at the right of the filter bar: it names the kinds of the hidden columns. Click it to show them, click **Hide empty columns** to hide them again.

**Files:**

- `views/PlotgridView.ts` (`renderGrid`: volume scope keeps inactive scenes, deselects a hidden column or a row that is not shown, sticky volume band, `data-km-row` on row headers; `kmRowHeader` (new) used by `applySelectionVisuals`, `selectRowHeader`, the row colour menu and the bold, italic and colour actions; `computeTotalWidth`; `moveSelection` (columns and rows); Enter in `onKeyDown`; Tab in `enterEditMode`; `startColResize`; `startLabelColumnResize`)
- `utils/plotgridVolume.ts` (`hiddenColumnsHintText`, `updateHiddenColumnsHint`, `firstVisibleColumn`, `stepVisibleColumn`, `stepRenderedRow`, `tabTarget`)
- `utils/volumes.ts` (`VolumeDividerTracker.renderBefore` returns the band)
- `styles.css` (fork section: `.plot-grid-canvas > .sl-km-volume-divider` without fixed `position: sticky`)
- `CHANGELOG-km.md`

## 1.11.8-km.17

**Volumes: numeric acts everywhere, safe act ranges, reorder volumes, no lost edits**

### A scene with act "05" is in Volume 2 everywhere

- A scene with `act: "05"` (or `" 5"`) showed the badge **V2**, but disappeared as soon as **Volume 2** was selected, because the volume selection compared act values as text.
- All volume decisions now use one rule: an act belongs to a volume when its number is one of the volume's acts. `5`, `"5"`, `"05"`, `" 5 "` and `"5.0"` are act 5. This applies to the volume selection in every view (Board, Corkboard, Plot Grid, Timeline, Subway, Manuscript, Navigator, Statistics, Characters, Locations, Codex), the scene badges, Statistics, the **Delete plotline** / **Rename plotline** impact overview and the export of one volume.
- **Prologue and Epilogue belong to no volume.** StoryLine stores the Prologue as act `0` and the Epilogue as act `99`. Scenes with act `0`, `"00"`, `99`, `"Prologue"` or `"Epilogue"` are hidden under every volume selection, get no volume badge and are not part of a volume's statistics or export, also when a volume's `acts:` names them (`acts: "0-4"` is read as acts 1–4). A volume whose acts are only 0 and/or 99 is no volume at all: it does not appear in the volume dropdowns, Statistics or badges, and stays untouched in the file like a draft.
- Other acts that are not a plain number (`Act 5`, `1.1a`) belong to no volume either. An empty act no longer counts as act 0 in the volume export.
- Scenes without an act (no `act:` key, or `act: ""`) stay visible under every volume selection, as before. An empty `act:` key (`act:` with nothing after it) is outside every volume in every view; before, the Navigator, Characters, Locations and Codex still showed such scenes.
- Corkboard notes follow their act like scenes, in every view: a note with an act of another volume is hidden. Before, the Navigator, Characters, Locations and Codex kept every note visible, and the Statistics sections Tension, Pacing coach and the CJK reading time left notes out even when their act was in the volume (they count notes without a volume selected, too). The main Statistics totals still leave notes out, as upstream does. Statistics still ignores notes without an act while a volume is selected.

### Act ranges with dashes, and limits

- `acts: "1–4"` (en dash) and `"1—4"` (em dash) are read as ranges. Before, such a volume silently disappeared.
- A range wider than 1000 acts (e.g. a typo `1-40000`) or an act above 9999 is ignored instead of freezing Obsidian. The rest of the list still counts (`"1-2, 99999"` is acts 1 and 2).
- In the Volumes editor, **From act** / **To act** refuse such values: the fields show the saved range again and a hint below the list says "acts go up to 9999, and a volume spans at most 1000 acts. Not saved, the previous range is shown again."
- **From act** / **To act** also leave out act 0 (Prologue) and act 99 (Epilogue): `0` to `4` is saved as acts 1–4 with the hint "Prologue (act 0) and Epilogue (act 99) are not part of volumes and were left out." A range of only act 0 or only act 99 is refused. **+ Add volume** never starts at act 0 or 99.
- The hint disappears with the next edit, move or delete in the list.

### Duplicate volume ids no longer merge volumes

- Two volumes with the same `id` in hand-written YAML were counted as one row in Statistics and could not be picked separately. Every view now keeps them apart (the second one is shown under the id `<id>~2` until the Volumes editor renumbers it in the file, which it does when it opens). Nothing is written by reading.

### Reorder volumes

- Each row in **Manage story structure** → **Volumes** has **↑** / **↓** buttons that move the volume up or down.
- Saving changes only the order of the entries in the project file:
  - The entries of the volumes shown in the editor swap places among the positions they occupy. Their contents (unknown keys such as `color`, the notation `acts: "1-4"`) stay as they are.
  - Every other entry keeps its exact position: drafts without acts, non-object entries, entries added by hand while the dialog was open. So they also keep their order among each other.
  - A new volume moved up takes the position of the volume it passes; a volume deleted elsewhere while the dialog was open is not re-added.
  - The order is written only after **↑** / **↓** was used. Otherwise an order changed by hand in the file while the dialog was open is kept, as before.

<!-- screenshot: Volumes editor rows with the ↑ / ↓ buttons -->
<!-- screenshot: Volumes editor with the "at most 1000 acts" hint -->

### No lost change when the dialog closes

- Changes are written 400 ms after the last edit. Closing the dialog (**Done**, Esc, ×) within that time now writes the last change at once; so does disabling or updating the plugin while the dialog is open. Leaving a field of the Volumes section also writes its change at once.

### Volumes and the other structure actions in the same dialog

- **Add act**, act labels, beat sheets and the other structure actions of upstream rewrite the whole project frontmatter (read the file, change it, write it back). If a volumes save happened between that read and write, the volumes change was overwritten.
- A pending volumes change is now written as soon as you press a mouse button or a key anywhere outside the Volumes section of the dialog, which is before the upstream action starts. Upstream keeps no copy of `volumes:` in memory; it always reads the file first, so the only risk is this read-to-write window.
- What remains:
  - An upstream save started elsewhere (another view, settings, sync) while a volumes save is being written can still overwrite it, as for any two plugins writing the same file.
  - On a very slow vault a click that directly follows a volumes edit may still interleave with the upstream save.
  - The reverse order is not protected either: when **Add act** (or another structure action) is clicked first and a volume is edited right afterwards, the volumes save can start while the upstream save is still between its read and its write. The upstream write then carries the old `volumes:` and the volumes change is lost. The Volumes editor cannot see upstream saves, so it cannot wait for them.
  - Volumes saves run one after another. A flush (closing the dialog, leaving a field, a click outside the section) queues behind a volumes save that is already running, so it is written a moment later, not at once; an upstream save that reads in between is the same window as above.
  - In all these cases, reopen the dialog to check, and repeat the edit if it is missing.

**How and where to use:**

1. Open **Board** or **Timeline** → **Manage story structure** (or the command **Manage volumes**) and open the **Volumes** section.
2. Click **↑** or **↓** in a row to move a volume. Open the project file: only the order of the entries changed; drafts and other entries are where they were.
3. Type `40000` into **To act**: the hint below the list appears and nothing is saved. Type a valid act: the hint disappears and the range is saved.
4. Change a title and click **Done** right away: reopen the dialog, the title is saved.
5. Change a title, then click **Add act** in the **Acts** section right away: both the new title and the new act are in the project file.
6. In the project file, write `act: "05"` in a scene of Volume 2 (acts 5–8) and select **Volume 2** in any view: the scene is shown, with the badge **V2**. A scene with act `0` / `Prologue` or `99` / `Epilogue` is hidden under every volume selection and has no badge.
7. Write `acts: "1–4"` (with an en dash) for a volume: the volume appears in the volume dropdown.
8. In the Volumes editor, set **From act** to `0` and **To act** to `4`: the volume is saved as acts 1–4 and the hint names the Prologue.

**Files:**

- `utils/volumes.ts` (`MAX_VOLUME_ACT`, `MAX_VOLUME_RANGE`, `isValidActRange`, `parseActList`, `actNumber`, `isVolumeAct`, `parseVolumeActs`, `resolveVolumeIds`, `parseVolumes`, `getVolumeForAct`)
- `utils/volumeScope.ts` (`scopeFilter`, `sceneActStringsInVolume`, `actInVolumeScope`, `volumeScopePredicate`)
- `components/VolumesEditor.ts` (`saveVolumes`, `renderVolumesEditor`, `VolumesEditorHandle`, `flushOpenVolumeEditors`)
- `components/StructureModalSections.ts` (`enhanceStructureModal`)
- `components/PlotlineDeleteImpact.ts` (`inScope`)
- `services/ExportService.ts` (`getSortedScenes`, act range)
- `services/ForkCommands.ts` (`registerForkCommands`)
- `styles.css` (fork section: volume row grid, `.sl-km-volume-move`)
- `CHANGELOG-km.md`

## 1.11.8-km.16

**Statistics per volume: complete warnings, correct deadlines, one scene set for every section**

### Warnings of the selected volume are complete

- With a volume selected, **Warnings** dropped every warning that does not name scenes: "Plotline X has no scenes in Act N", "Plotline X was last seen in Act N …" and "Act imbalance". They are now computed for the volume's own scenes and shown again.
- **Setup/Payoff** warnings are still computed together with the linked scenes of other volumes, so a setup in this volume that pays off in a later volume is not reported as missing. Off page lines still replace their act gap warnings with "stages not yet told".

### Volume deadlines match the overview

- The **Volumes** table counted days from UTC midnight. East of UTC it showed **(1 d)** on the deadline day and **(0 d)** the day after instead of **overdue**, and its **Words/day** differed from the overview card.
- The table now uses the same deadline plan as **Project Overview**, with the same "include weekends" setting: the hint shows the remaining writing days, **(overdue)** after the deadline while words are missing, and nothing once the goal is reached. For volumes with their own word goal and deadline, **Words/day** is the same number as in the overview (the overview also falls back to scene targets or the project goal and deadline, the table does not).

### Volume table

- **Acts** shows ranges correctly: `1, 3` or `1–3, 5` instead of `1–3` for acts that are not contiguous.
- The **All volumes** row now counts every scene of the project, like the overview with **All volumes** selected. Scenes whose act belongs to no volume are counted and noted, e.g. **All volumes (incl. 4 outside volumes)**. Its goal and deadline follow the overview too: sum of the volume goals (else the project word goal), project deadline (else the latest volume deadline).
- The section remembers whether it is open or closed.
- **Open setups at end of volume** follows the act order of the volumes, also when the volumes are not listed in act order in the project file.

### One scene set for every section

- With a volume selected, every section uses the volume's own scenes (scenes without an act are not counted), each with the same active/inactive rule as without a selection. Before, **Tension curve** and **Pacing coach** also counted scenes without an act.

### Writing Trail names the volume total

- With a volume selected, the first card in **Writing Trail** is labelled **Words in volume** (the volume's word count). The other cards (**Net tracked**, **Words added**, **Active days**) are tracked per project as before. Without a selection nothing changes.

### The original layout names the volume

- With the **original** Statistics layout, the view now also shows the heading **Volume 2 statistics** / **Project statistics (all volumes)** above the overview when the project defines volumes.

<!-- screenshot: Statistics in the original layout with the volume heading -->
<!-- screenshot: Volumes table with "1, 3" acts, deadline hint and "All volumes (incl. N outside volumes)" -->
<!-- screenshot: Writing Trail with "Words in volume" -->

### "Edit volumes" keeps Statistics open

- **Edit volumes** in Statistics (and the commands **Manage story structure** / **Manage volumes**) replaced the current tab with the Board when neither Board nor Timeline was open. The Board now opens in a new tab and Statistics stays where it is.
- If the dialog could not be opened, the Volumes section is no longer forced open the next time the dialog opens.

**How and where to use:**

1. Open **Statistics** and pick a volume in the volume dropdown in the toolbar.
2. Open **Warnings**: plotline gaps and act imbalance inside the volume are listed again; setups that pay off in another volume are not reported.
3. In the **Volumes** section, check **Acts**, the deadline hint and **Words/day**: they match **Project Overview** for the same volume. Collapse the section; it stays collapsed after a refresh or restart.
4. Pick **All volumes**: the **All volumes** row shows the same word total as the overview; its scenes plus arc points equal the overview's **Scenes** card. A note counts the scenes outside every volume.
5. Open **Writing Trail** with a volume selected: the first card reads **Words in volume**.
6. In **Settings** → StoryLine → **Statistics view**, choose **Original**: the heading above the overview names the selected volume.
7. Close Board and Timeline, then click **Edit volumes** in Statistics: the Board opens in a new tab with **Manage story structure** → **Volumes** open, and the Statistics tab stays.

**Files:**

- `utils/volumeStatsScope.ts` (`validateForScope`)
- `utils/volumeSetups.ts` (`computeOpenSetups`)
- `components/VolumeStatsSection.ts` (`computeVolumeStats`, `computeTotalRow`, `formatActRanges`, `deadlineHint`, `renderVolumeStatsSection`, `renderOpenSetups`)
- `components/StructureModalSections.ts` (`clearNextStructureSection`, `enhanceStructureModal`)
- `services/ForkCommands.ts` (`openStructureDialog`)
- `views/StatsView.ts`
- `CHANGELOG-km.md`

## 1.11.8-km.15

**Volume selector: always up to date, in every view, also in Characters, Locations and Codex**

### The volume dropdown no longer goes stale

- Board, Plot Grid and Navigator built their volume dropdown only once, when the view opened. After picking a volume in another view, the dropdown still showed the old value, and **All volumes** could not be picked again. After switching books in series mode it still listed the previous book's volumes, and picking one stored a foreign volume id for the new book. Added or renamed volumes did not show up.
- All volume dropdowns (Board, Manuscript, Plot Grid, Timeline, Subway, Statistics, Navigator, Characters, Locations, Codex) now update themselves: options, title and selected value always follow the current project, after every refresh, on every project switch (also when opening a character, location or codex entry of another book) and as soon as the `volumes:` of the project file change.
- The Navigator dropdown also appears when Obsidian starts before the project's metadata is ready; it shows up by itself once the volumes are known.
- A dropdown can no longer store a volume id that the current project does not define.

### Deleted volumes do not come back as the selection

- Deleting the selected volume in **Manage story structure** → **Volumes** resets the selection to **All volumes**.
- The volumes editor now keeps a high-water mark `volumeIdSeq` in the project file: the highest volume number it has ever saved, including deleted volumes. **+ Add volume** creates `v<volumeIdSeq + 1>` (or higher, if an existing id, a volume deleted in the open dialog or the stored selection has a higher number). So an id that the editor has saved once is never handed out again, also after closing and reopening the dialog and on other devices that still have the old volume selected.
- Not covered: ids that were deleted before this version, or added and removed only by hand in the project file without the editor saving in between, are unknown to `volumeIdSeq` and can be reused once.
- The editor no longer rewrites the whole `volumes:` block. Exactly what it writes to the project file:
  - **On opening** the Volumes tab, only if needed, and only `id` values in place plus `volumeIdSeq`:
    - Entries without `id` get the id they already have (`v1`, `v2`, … by position, never one that another entry uses). An entry without valid acts (a draft) gets a free `v<position>` id. So removing an entry above them no longer renames the ones below.
    - **Duplicate ids:** if several entries share an `id`, the first keeps it and every later one gets a new id above every id in the list and above `volumeIdSeq` (e.g. `v1, v1, v3` becomes `v1, v4, v3`). The tab then shows "Duplicate volume ids were renumbered: Second (v1 → v4)." Before, the editor showed both rows but saved only one of them.
    - When ids were added or renumbered, `volumeIdSeq` is raised to the highest volume number now in the list.
    - If all ids are present and unique, opening writes nothing.
  - **On an edit**, for each volume shown in the tab, only `id` and the fields changed in the tab (title, acts, word goal, deadline). Unchanged fields keep their notation (e.g. `acts: "1-4"`); changed acts are written as a list (`[1, 2, 3]`). Other keys (e.g. `color`) stay. Only volumes added in this dialog are appended at the end. The edit also writes `volumeIdSeq`.
  - **On delete** (× in a row), exactly one entry with that id is removed from the file, once: the one whose fields still match what the dialog showed (otherwise the first one with that id). Another entry with the same id added elsewhere meanwhile stays. If no entry is left, `volumes:` is removed (`volumeIdSeq` stays).
  - **Volumes deleted elsewhere** (by hand, by sync or on another device) while the dialog is open are not written back: the next edit in the dialog leaves them deleted, even though the dialog still shows their row until it is reopened. This also applies to a volume added in this dialog and deleted elsewhere after it was saved.
  - Every entry that the tab does not show is kept untouched in its position: drafts without acts, entries that are not objects, entries added in the file by hand, by sync or on another device while the dialog was open, and a second entry with an id that was already written. The order of the entries in the file is kept, also if it was changed by hand meanwhile.
  - For a volume the tab shows, a field changed in the file meanwhile keeps the file's value unless the same field is changed in the tab.
- New volumes also skip the ids of draft entries.
- A stored selection that points to a volume that no longer exists (e.g. removed by hand in the project file) is reset to **All volumes** on this device.

### Faster scene lists with a volume selected

- The volume selection is now resolved once per render instead of once per scene. This makes typing in the Navigator search and opening Statistics faster in large projects.

### Views start at the top after a volume change

- When the volume selection changes, all views open at the top of the new volume instead of jumping to the old scroll position. Normal refreshes (edits, saves) keep the scroll position as before.

### Characters, Locations and Codex follow the volume selection

- The **Characters**, **Locations** and **Codex** views now show the same volume dropdown in their toolbar, so the volume can be switched from there too.
- With a volume selected, they count and list only the scenes of that volume: scene counts and POV counts on character and location cards, the scene list, POV/presence stats, gaps and intensity curve in the character side panel, the scene list and stats of a location or world, the Story graph, and the scenes in **Referenced by** (references from characters, locations and codex entries stay). Scenes without an act stay visible in every volume, as in the other views.
- So that an entity never looks unused just because its scenes are in other volumes, the views say what the selection hides:
  - Character cards without scenes in the selected volume say **No scenes in Volume 2** (instead of "No scenes yet").
  - The scene stats of a character, location or world add a line such as **3 more in other volumes**.
  - **Referenced by** shows **No references in Volume 2 (3 in other volumes)** when all references are scenes of other volumes (Characters and Locations used to hide the section, Codex said "No linked entries yet"), and **N more in other volumes** when some are hidden.
- **Characters from scenes (no profile yet)** lists only characters that appear (`characters:` or `pov:`) in scenes of the selected volume (inactive scenes included, as in the unfiltered list).
- A volume switch always re-renders these views, also right after saving an entry or right after the view opened (the short "just saved" pause that protects the editor no longer swallows the switch).
- The "may need review" warning of a modified codex entry still lists all affected scenes, so none is missed.

<!-- screenshot: Characters view toolbar with the volume dropdown -->
<!-- screenshot: Codex entry, Referenced by limited to the selected volume -->
<!-- screenshot: Character side panel with "3 more in other volumes" -->

**How and where to use:**

1. Define volumes in **Manage story structure** → **Volumes** (command **Manage volumes**), if not done yet.
2. Pick a volume in the volume dropdown of any view: the **Filter by** dropdown at the left of the filter bar (Board, Manuscript, Plot Grid) or the dropdown in the toolbar (Timeline, Subway, Statistics, Navigator, Characters, Locations, Codex).
3. All other open views switch to that volume right away and show the same value, and start at the top. Pick **All volumes** in any of them to show everything again.
4. Open **Characters**, **Locations** or **Codex** and select an entry: the scene lists and **Referenced by** show only scenes of the selected volume.
5. If an entity shows **No scenes in Volume 2** or **N more in other volumes**, pick **All volumes** (or the other volume) in the dropdown to see those scenes.
6. Delete a volume in **Manage story structure** → **Volumes** (× at the end of its row): if it was selected, the views go back to **All volumes**. **+ Add volume** creates a volume with a fresh id; the project file now also holds `volumeIdSeq` (leave it in place).

**Files:**

- `utils/volumeScope.ts` (self-updating dropdown registry `syncVolumeScopeSelects` / `registerVolumeScopeSync`, `volumeScopePredicate`, `scopeScenes`, `scopeSceneRefs`, `clearVolumeScope`, `clearVolumeScopeIfId`, `nextVolumeId`, `volumeScopeChanged`, scroll reset after a volume change)
- `utils/volumes.ts` (`resolveVolumeIds`, `normalizeVolumeIds`, `readVolumeIdSeq`, `volumeIdNumber`, collision-free positional ids)
- `components/VolumeScopeNotes.ts` (new: "hidden by the volume selection" notes)
- `components/VolumesEditor.ts`
- `services/ForkCommands.ts`
- `main.ts`
- `views/PlotgridView.ts`
- `views/NavigatorView.ts`
- `views/StatsView.ts`
- `views/CharacterView.ts`
- `views/LocationView.ts`
- `views/CodexView.ts`
- `styles.css` (fork section: `.sl-km-scope-hidden-note`)
- `CHANGELOG-km.md`

## 1.11.8-km.14

**Plotlines and off page: delete and rename show what is really affected, off page status follows**

### "Delete plotline" shows what is really affected, per volume

- Deleting a plotline removes its tag from **every** scene of the project. With a volume selected, the dialog used to count only the scenes of that volume, so it promised far fewer changes than it made.
- The dialog now says how many scenes carry the plotline in the current selection, and warns how many **more** scenes in how many **other volumes** will lose the tag as well.
- Below, one column per volume lists every affected scene side by side; the selected volume is highlighted.
- Two extra columns when needed: **No act** (scenes without an act; they are visible under every volume selection and count as part of it) and **Not in a volume** (acts that belong to no volume, an empty or blank `act:`, or an act written differently from the volume's list, e.g. `"01"`, which the views also hide under that volume).
- Which scenes count as "in the current selection" follows exactly the rule the views use for the volume selection, also when two volumes share an act.
- Inactive scenes, corkboard notes and scenes hidden by the scene / Arc Point filter are counted too, because the tag is removed from them as well; the dialog names them in an extra line and marks them in the lists.
- Without volumes, the dialog shows the total for the whole project (including inactive scenes and corkboard notes, which the upstream count left out).

<!-- screenshot: Delete plotline dialog with one column per volume -->

### "Rename plotline" states the impact too

- Renaming also changes the tag in every scene of the project. With a volume selected, the dialog says how many scenes in the current selection get the new name, and warns how many **more** scenes in other volumes (or outside any volume) are renamed as well. Without volumes it gives the total. Like the delete dialog, it names included inactive scenes and corkboard notes, which the list does not show but which are renamed too.
- Renaming a plotline to a name a scene already carries no longer gives that scene the tag twice (upstream bug).

<!-- screenshot: Rename plotline dialog with the impact sentence -->

### On page / off page in the Plotlines list view

- The plotline header's right-click menu in the **list view** now has **Move to off page** / **Move to on page**, the same switch as in the Subway map. The list regroups right away under ON PAGE / OFF PAGE.

<!-- screenshot: Plotlines list view, header context menu with Move to off page -->

### Off page status is kept on rename and delete

- Renaming an off page plotline moves its off page status to the new name; deleting a plotline removes it from `offPageLines` in the project file. Before, the old name stayed in the list and the renamed line jumped back to on page.
- `offPageLines` entries and scene tags are compared after the plotline tag rule (lowercase, spaces become dashes), on both sides. So `[Mark, Politics]` and `[mark, politics]` both mark the plotlines `Mark` / `mark` and `Politics` / `politics`, and a hand-written scene tag such as `Main Mystery` matches `main-mystery`. This works in the Subway map, the Plotlines list, the Timeline swimlanes, the Plot Grid and Statistics.
- A comma separated value (`offPageLines: mark, politics`) is read as well and is no longer wiped when a line is moved. When a line is moved, renamed or deleted, the list is written back in normalized form (`[mark, politics]`); otherwise it is left as written.
- Statistics ignore entries in `offPageLines` that no longer exist as a tag in any scene.
- The off page warning in Statistics lists at most 5 open stages per line, followed by "and N more".
- The hint at the top of the **Off page coverage** section in Statistics now reads "Stages (arc points) on off page lines and whether they are already told in a scene (link them in the inspector)." (sentence case, as Obsidian's guidelines require).

**How and where to use:**

1. Select a volume in any volume dropdown (optional; without one, the dialogs show project totals).
2. Delete: **Plotlines** (list view) → plotline header → delete icon, or right-click the header → **Delete plotline**. Read the overview, then **Delete** or **Cancel**.
3. Rename: **Plotlines** (list view) → plotline header → pencil icon, or right-click the header → **Rename plotline**. The sentence below the name field says how many scenes get the new name, here and in other volumes. Enter the new name and click **Rename**; an off page line stays off page.
4. On page / off page: **Plotlines** (list view) → right-click a plotline header → **Move to off page** (or **Move to on page**). In the Subway map: right-click the line name, as before.
5. **Statistics** → Warnings: off page lines with many open stages show the first 5 and "and N more".

**Files:**

- `components/PlotlineDeleteImpact.ts` (new: impact per volume and dialog texts for delete and rename)
- `utils/pageZones.ts` (shared parser and tag normalization for `offPageLines`, `isOffPage`, rename/delete hook `transferOffPage`, menu entry `addZoneMenuItem`)
- `components/OffPageStatsSection.ts` (match scene tags normalized, ignore orphaned entries, cap warning titles, hint text)
- `views/StorylineView.ts` (delete and rename dialogs, off page hooks, list view context menu entry)
- `views/PlotgridView.ts` (off page check uses `isOffPage`)
- `views/TimelineView.ts` (swimlane tint uses `isOffPage`)
- `services/SceneManager.ts` (+2: no duplicate tag on rename)
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
- Stored in the project file as `offPageLines: [mark, politics]` (the plotline tags); it can also be edited by hand.
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
