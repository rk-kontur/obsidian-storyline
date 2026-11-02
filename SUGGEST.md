# Export option "Include arc points"

## Summary
Adds an "Include arc points" toggle to the Export dialog so scenes marked as arc point can be left out of an export.

## What it does
The Export dialog gets a new toggle "Include arc points" below "Include inactive scenes", on by default, so the default export is unchanged. When switched off, scenes with `arcAnchor` are left out of every content type (manuscript, chapters, scenes, outline) and every format. Like the other include toggles, the choice is not remembered between exports.

## How it works
`ExportOptions` gets an optional `includeArcPoints` flag (default `true`), which `ExportModal` passes to the export together with the other include options. `ExportService.getSortedScenes`, the single scene source of all exports, drops arc points only when the flag is `false`.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-feature-export-include-arc-points
- Code:
  - Toggle: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-export-include-arc-points/components/ExportModal.ts#L140-L146
  - Option: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-export-include-arc-points/services/ExportService.ts#L33-L34
  - Filter: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-export-include-arc-points/services/ExportService.ts#L153-L155

## Needed addons
One screenshot of the Export dialog (content "Manuscript") showing the new "Include arc points" toggle below "Include inactive scenes".
