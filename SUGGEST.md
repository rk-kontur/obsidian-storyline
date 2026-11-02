# Manage story structure command

## Summary
Adds a command palette command "Manage story structure" that opens the structure dialog from anywhere.

## What it does
The command opens the existing structure dialog of an open Board or Timeline view. If neither view is open, it opens the Board in a new tab (the current tab, e.g. Statistics, stays) and then the dialog. The command can get a hotkey in Settings → Hotkeys.

## How it works
A new file `services/StructureCommand.ts` registers the command; `main.ts` calls it once in the command block. It finds the Board or Timeline leaf, loads it if it is deferred, and calls `openStructureModal()` on the `BoardView` / `TimelineView` instance. `openStructureModal()` is made public in both views (only `private` removed).

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-command
- Code: [StructureCommand.ts](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-command/services/StructureCommand.ts#L13-L38), [main.ts registration](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-command/main.ts#L430), [BoardView.openStructureModal](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-command/views/BoardView.ts#L3276), [TimelineView.openStructureModal](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-command/views/TimelineView.ts#L1312)

## Needed addons
None.
