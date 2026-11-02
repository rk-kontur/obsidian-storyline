# Delete plotline: count every scene that loses the tag

## Summary
The "Delete plotline" confirmation now states the number of scenes that deleting really changes, not only the scenes listed in the view.

## What it does
`deleteTag()` removes the tag from every scene in the project, but the dialog counted only the scenes the Plotlines list shows, so inactive scenes, corkboard notes and scenes hidden by the Arc Point filter lost the tag without being counted. The dialog now counts exactly the scenes `deleteTag()` changes. When some of them are not listed in the view, a short line names them, e.g. "Includes 1 inactive scene, 2 corkboard notes. They are not listed in this view, but lose the tag too."

## How it works
`confirmDeletePlotline()` receives the listed scenes instead of their count and counts `getAllScenes()` with the same condition as `deleteTag()` (`tags.includes(tag)`). It splits the scenes the list does not show into corkboard notes, inactive scenes and scenes hidden by the current filter. The rest of the dialog and the delete itself are unchanged.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-fix/delete-plotline-count
- Code: [`confirmDeletePlotline()`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-fix/delete-plotline-count/views/StorylineView.ts#L1157-L1203), call sites [delete icon](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-fix/delete-plotline-count/views/StorylineView.ts#L877-L880) and [context menu](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-fix/delete-plotline-count/views/StorylineView.ts#L914-L918), [`deleteTag()`](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-fix/delete-plotline-count/services/SceneManager.ts#L1886-L1899)

## Needed addons
One screenshot: Plotlines view (list view), a plotline whose tag is also on one inactive scene and one corkboard note; click the plotline's delete icon. It must show the "Delete plotline" dialog with the full count and the "Includes 1 inactive scene, 1 corkboard note. …" line.
