# Fix duplicate tags when renaming a plotline

## Summary
Renaming a plotline to a tag a scene already has no longer leaves that tag twice in the scene's `tags`.

## What it does
When a plotline is renamed (Plotlines list view, pencil icon or right-click the header, then **Rename plotline**) to a name that some scenes already carry, those scenes keep the tag once instead of getting it twice. This effectively merges two plotlines cleanly. Scenes without the new tag are renamed exactly as before.

## How it works
`SceneManager.renameTag()` now passes the mapped tag list through a `Set` before writing it, so the first occurrence keeps its position and the duplicate is dropped. The rest of the rename flow is unchanged.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-fix-rename-tag-duplicates
- Code: [`SceneManager.renameTag()`](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-rename-tag-duplicates/services/SceneManager.ts#L1874-L1885), caller [`StorylineView.openRenamePlotlineModal()`](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-rename-tag-duplicates/views/StorylineView.ts#L1078-L1099)

## Needed addons
None
