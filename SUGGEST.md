# Volumes: model and Volumes editor

## Summary
Lets a project group its acts into named volumes (`volumes:` in the project file) and edit them in a new Volumes section of "Manage story structure".

## What it does
"Manage story structure" (Board, Timeline, or the new command **Manage volumes**) gets a **Volumes** section below **Chapters**; the rest of the dialog is unchanged. Each volume is one row (title, from act, to act, word goal, deadline, move up/down, remove), saved to the project file automatically; overlapping acts and acts without a volume are pointed out. Scenes, numbering and file names are untouched: a scene belongs to the volume of its act, and Prologue (act 0) and Epilogue (act 99) belong to no volume.

## How it works
`utils/volumes.ts` parses `volumes:` (act lists like `[1, 2]` or `"1-4"`, acts matched by number so "05" is act 5, range limits, unique ids) and offers the lookups later features use (`getProjectVolumes`, `getVolumeForAct`, `getActsForVolume`). The editor writes only the fields changed in the dialog and keeps unknown keys, drafts and the notation of unchanged values; it also writes the new project-file key `volumeIdSeq` (highest volume number handed out) on save, so ids are never reused. A pending change is written before any other action in the dialog starts (those rewrite the frontmatter from a fresh read), on close (chained to the dialog's `onClose`) and on unload.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-01-core
- Code:
  - Model: [utils/volumes.ts](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L1-L274) (`parseVolumes` [L190-L226](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L190-L226), `getVolumeForAct` [L264-L269](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L264-L269))
  - Editor: [`saveVolumes`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/VolumesEditor.ts#L158-L263), [`renderVolumesEditor`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/VolumesEditor.ts#L298-L515), [`addVolumesSection`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/VolumesEditor.ts#L538-L569), called in [BoardView](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/views/BoardView.ts#L3544) and [TimelineView](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/views/TimelineView.ts#L1666)
  - Command: [services/StructureCommands.ts](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/services/StructureCommands.ts#L15-L46)
- Depends on: none (base of the volumes series)

## Needed addons
- Board → structure button → "Manage story structure", scrolled so the **Volumes** section below **Chapters** is visible with two volumes (e.g. acts 1–4 and 5–8), showing the row fields, the ↑/↓ and × buttons and "+ Add volume".
