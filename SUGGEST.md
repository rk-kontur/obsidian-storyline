# Plot Grid: keyboard selection follows the displayed rows

## Summary
Arrow keys, Tab and the highlighted row header in the Plot Grid now follow the rows as they are displayed, not the order of the data.

## What it does
With a sort, a filter or a collapsed act or chapter, ↑ / ↓ (and Tab while editing at the end of a row) move to the next displayed row instead of the next data row, so the selection no longer jumps around or gets stuck on a row that is not shown. The highlighted row header (also for Bold, Italic and the colour actions) is the one of the selected row. A selection whose row gets filtered out or collapsed is cleared, and the next arrow key starts at the first displayed row.

## How it works
Row headers get `data-row` like the cells, and the new `getRowHeaderElement()` replaces all `querySelectorAll('.plot-grid-row-header')[index]` lookups, which counted only rendered headers. The new `stepRenderedRow()` steps through the existing `renderedRowTrackIndices` map (rendered rows in display order) and is used by `moveSelection()` and Tab in `enterEditMode()`. `renderGrid()` drops a selection whose row is not rendered.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-fix-plotgrid-keyboard-selection
- Code: [renderGrid: clear selection](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-plotgrid-keyboard-selection/views/PlotgridView.ts#L1159-L1163), [row header data-row](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-plotgrid-keyboard-selection/views/PlotgridView.ts#L1421), [getRowHeaderElement / stepRenderedRow / moveSelection](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-plotgrid-keyboard-selection/views/PlotgridView.ts#L2180-L2211), [Tab while editing](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-plotgrid-keyboard-selection/views/PlotgridView.ts#L2932-L2933)

## Needed addons
None
