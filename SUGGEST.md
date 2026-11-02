# Manuscript: keep scenes visible with Pane Relief "Maximize active tab"

## Summary
With the Pane Relief plugin's "Maximize active tab" on, clicking into a scene in the Manuscript no longer hides the Manuscript or resets its scroll position.

## What it does
Pane Relief hides every leaf and split that is not the maximized one, and the Manuscript's embedded scene editors are real workspace leaves. So the scene editors could be hidden, and when one became the active leaf (a click into it, or an editor mounting while scrolling) the Manuscript itself was hidden, which blanked the page and made the scroll position jump. Now the Manuscript and all its scene editors stay visible and the clicked scene stays the active editor; without Pane Relief or with maximize off nothing changes.

## How it works
CSS only: three rules scoped to `.workspace.should-maximize` (Pane Relief's maximize class) next to the existing embedded-editor styles in `styles.css`. They keep the Manuscript leaf, the embedded splits and their leaves displayed, and hide the embedded editors' view header as usual. The `:has()` follows the fixed child chain built by `ManuscriptView` instead of a descendant search, so it stays cheap while typing (same concern as #105).

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:_suggest-fix-manuscript-pane-relief
- Code: [styles.css rules](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-manuscript-pane-relief/styles.css#L11038-L11056); DOM chain they match: [scroll area](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-manuscript-pane-relief/views/ManuscriptView.ts#L308), [scene block](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-manuscript-pane-relief/views/ManuscriptView.ts#L510), [editor wrap](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-manuscript-pane-relief/views/ManuscriptView.ts#L541), [embedded split in mountEditor](https://github.com/rk-kontur/obsidian-storyline/blob/_suggest-fix-manuscript-pane-relief/views/ManuscriptView.ts#L616-L624)

## Needed addons
None.
