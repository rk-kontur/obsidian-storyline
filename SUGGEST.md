# Arc Point "realized by" link

## Summary
An Arc Point can be linked to the scene that tells it (`realizedBy` in its frontmatter).

## What it does
In the Inspector, a ticked **Arc point** shows a **Realized** dropdown in the same row; picking a scene stores `realizedBy: "[[Scene]]"`, picking **not yet** removes it, and unticking **Arc point** removes the link as well. In the Subway map a realized Arc Point no longer gets its own station: its diamond sits on its own lines at the station of the linked scene, joined to it by a dashed line. Without any `realizedBy` link, everything behaves exactly as before.

## How it works
`utils/arcRealization.ts` (new) reads, resolves and writes the link straight from the metadata cache (scene parser and `Scene` model untouched) and holds the Subway helpers. `components/RealizedByControl.ts` (new) renders the dropdown; `Inspector.ts` calls it and clears the link on untick. `StorylineView.renderSubway` removes realized Arc Points from the station list, gives them their scene's column and draws the dashed link.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-feature-realized
- Code:
  - Link read / resolve / write: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/utils/arcRealization.ts#L20-L96
  - Realizations and Subway helpers: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/utils/arcRealization.ts#L98-L221
  - Inspector dropdown: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/components/RealizedByControl.ts#L13-L63
  - Inspector hook: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/components/Inspector.ts#L493-L501
  - Subway map: https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/views/StorylineView.ts#L427-L438, https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/views/StorylineView.ts#L594-L597, https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-feature-realized/views/StorylineView.ts#L649

## Needed addons
- Inspector of an Arc Point scene with **Arc point** ticked and the **Realized** dropdown set to a scene.
- Plotlines view in Subway mode with one realized Arc Point: its diamond on its own line at the linked scene's station, with the dashed link to that scene.
