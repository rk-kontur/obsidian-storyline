# Collapsible sections in "Manage story structure"

## Summary
Each section of the "Manage story structure" dialog (Board and Timeline) can be collapsed by clicking its heading.

## What it does
Every section heading ("Beat sheet templates", "Acts", "Chapters", and on the Board also "Saved custom beat sheets" and "Custom structure builder") gets a chevron and folds its content in or out. Order, width and content of the dialog are unchanged, and with the default settings all sections open expanded, so the dialog looks as before. The state follows the existing "Default section state" setting (Expanded / Collapsed / Remember last state) and is kept for the session in both dialogs.

## How it works
A new helper `createStructureSection()` builds a `<details>` with the heading in its `<summary>` and returns the body; `openStructureModal()` in BoardView and TimelineView calls it where it created the `<h3>` and adds the section content to the body instead of `contentEl`. The state uses the existing `isSectionCollapsed()` / `rememberSectionState()` with keys `structure:<section>`. A few lines of CSS add the chevron, and the setting description mentions the dialog.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/structure-collapsible-sections
- Code: [createStructureSection](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-collapsible-sections/components/StructureSection.ts#L14-L38), [BoardView.openStructureModal](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-collapsible-sections/views/BoardView.ts#L3277-L3865), [TimelineView.openStructureModal](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-collapsible-sections/views/TimelineView.ts#L1313-L1674), [CSS](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-collapsible-sections/styles.css#L6992-L7019), [setting description](https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/structure-collapsible-sections/settings.ts#L1277-L1278)

## Needed addons
Two screenshots of the Board view's "Manage story structure" dialog: (1) default state, all sections expanded (top with "Beat sheet templates" and the chevrons visible); (2) "Beat sheet templates" expanded and "Acts", "Chapters", "Saved custom beat sheets" and "Custom structure builder" collapsed, so all five headings with their chevrons are visible.
