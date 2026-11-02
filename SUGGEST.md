# POV character counts as a scene character

## Summary
A scene's POV character is treated as one of its characters in the character filter and in the Timeline swimlanes "By Character".

## What it does
Filtering by a character (filter panel in Board, Manuscript, Plot Grid) now also finds scenes where that character is only the POV, and Timeline swimlanes grouped by character show such a scene in the POV character's lane. The character filter already offers POV-only characters (`getAllCharacters` includes `pov`), but until now selecting one found none of their POV-only scenes. This changes default behaviour (there is no setting), and the filter now compares names case-insensitively, as `getAllCharacters` already dedupes them.

## How it works
New helper `utils/sceneCharacters.ts` returns `characters` plus `pov` without duplicates (case-insensitive) and checks a scene against a list of names. `SceneQueryService.matchesFilter` and `TimelineView.getSceneLaneKeys` (case `character`) use it; one line changed in each.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-feature-pov-as-character
- Code:
  - https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-pov-as-character/utils/sceneCharacters.ts#L15-L31
  - https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-pov-as-character/services/SceneQueryService.ts#L374-L378
  - https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-pov-as-character/views/TimelineView.ts#L759-L761

## Needed addons
Screenshot of the Timeline in swimlane mode, Group by Character, with a scene that has POV "Anna" but does not list Anna under Characters: the scene appears in Anna's lane.
