# Volumes: model and Volumes editor

## Summary
Lets a project group its acts into named volumes (`volumes:` in the project file) and edit them in a new Volumes section of "Manage story structure".

## What it does
"Manage story structure" (Board, Timeline, or the new commands **Manage story structure** / **Manage volumes**) shows its content as collapsible sections Volumes, Acts, Chapters and Templates. In Volumes, each volume is one row (title, from act, to act, word goal, deadline, move up/down, remove); changes are saved to the project file automatically, overlapping acts and acts without a volume are pointed out. Scenes, numbering and file names are untouched: a scene belongs to the volume of its act, and Prologue (act 0) and Epilogue (act 99) belong to no volume.

## How it works
`utils/volumes.ts` parses `volumes:` (act lists like `[1, 2]` or `"1-4"`, acts matched by number so "05" is act 5, range limits, unique ids) and offers the lookups later features use (`getProjectVolumes`, `getVolumeForAct`, `getActsForVolume`). The editor writes only the fields changed in the dialog and keeps unknown keys, drafts and the notation of unchanged values; ids are never reused (`volumeIdSeq`), and a pending change is written before any other structure action, on close and on unload. The dialog is built as before; `enhanceStructureModal` regroups it at its `<h3>` headings just before it opens (left as is if the headings change).

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/volumes-01-core
- Code:
  - Model: [utils/volumes.ts](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L1-L274) (`parseVolumes` [L190-L226](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L190-L226), `getVolumeForAct` [L264-L269](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/utils/volumes.ts#L264-L269))
  - Editor: [`saveVolumes`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/VolumesEditor.ts#L159-L264), [`renderVolumesEditor`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/VolumesEditor.ts#L299-L505)
  - Dialog sections: [`enhanceStructureModal`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/components/StructureModalSections.ts#L59-L148), called in [BoardView](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/views/BoardView.ts#L3836) and [TimelineView](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/views/TimelineView.ts#L1674)
  - Commands: [services/StructureCommands.ts](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/volumes-01-core/services/StructureCommands.ts#L16-L52)
- Depends on: none (base of the volumes series)

## Needed addons
- Board → structure button → "Manage story structure" with all sections collapsed (shows the four sections Volumes, Acts, Chapters, Templates).
- Same dialog with the Volumes section open and two volumes (e.g. acts 1–4 and 5–8), showing the row fields, the ↑/↓ and × buttons and "+ Add volume".
