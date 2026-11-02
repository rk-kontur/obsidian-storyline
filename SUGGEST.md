# On page / off page plotlines

## Summary
Plotlines can be marked "off page" (background developments that are not told in scenes) and are shown in their own zone.

## What it does
Right-click a line name in the Subway map, or a plotline header in the list view, and choose **Move to off page** / **Move to on page**. Off page lines are drawn below the on page lines in a tinted band (Subway, with "On page" / "Off page" headers), listed under their own heading (list view), placed last and tinted (Timeline swimlanes by plotline or tag), and tinted as Plot Grid plotline columns. Renaming or deleting a plotline keeps the list in step; without `offPageLines` in the project file nothing changes.

## How it works
The new `utils/pageZones.ts` reads and writes `offPageLines: [mark, politics]` in the project frontmatter (a comma separated string is read too) and matches entries and scene tags case-insensitively after the plotline tag rule (lowercase, spaces become dashes). The views call `getOffPageLines` / `isOffPage` / `orderByZone` and add an `is-off-page` class; the Subway keeps lane colours from the unzoned order. Rename and delete call `transferOffPage`, which only touches the project file when the plotline is off page.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/offpage-01-zones
- Code:
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/utils/pageZones.ts#L46-L105 (read, match, write, rename/delete hook, zone order)
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/utils/pageZones.ts#L134-L170 (context menu entry)
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/StorylineView.ts#L401-L410 (Subway zoning) and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/StorylineView.ts#L497-L507 (band and headers)
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/StorylineView.ts#L336-L343 (list view headings)
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/StorylineView.ts#L1126 (rename) and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/StorylineView.ts#L1198 (delete)
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/TimelineView.ts#L639-L642 and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/views/PlotgridView.ts#L1081-L1084
    - https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/offpage-01-zones/styles.css#L13877-L13926

## Needed addons
- Plotlines, Subway map, with at least one line moved to off page: shows the "On page" / "Off page" headers and the tinted off page band.
- Plotlines, list view: right-click on a plotline header with the menu open on "Move to off page", and the "On page" / "Off page" headings.
- Timeline, swimlanes "By Plotline": the tinted off page lane at the right end.
