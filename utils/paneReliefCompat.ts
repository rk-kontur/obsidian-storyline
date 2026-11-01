// ═══════════════════════════════════════════════════════
//  Compatibility with "Maximize active tab" (Pane Relief) (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The Manuscript hosts one embedded Obsidian editor (a workspace leaf) per
// scene. While those load, Obsidian briefly reports one of them as the
// active leaf. Pane Relief maximizes whatever leaf becomes active, so it
// maximizes the embedded editor and hides everything else, including the
// Manuscript itself: the page turns blank. When that happens, this hands
// the maximized state back to the view that owns the embedded editor.
// Without a maximized tab (or without Pane Relief) the check never fires.

import type { App, WorkspaceLeaf } from 'obsidian';

export function reclaimMaximize(app: App, ownLeaf: WorkspaceLeaf, viewContainer: HTMLElement): void {
    const workspaceEl = (app.workspace as unknown as { containerEl?: HTMLElement }).containerEl;
    if (!workspaceEl?.classList.contains('should-maximize')) return;
    // A maximized leaf INSIDE this view = one of our embedded editors
    if (!viewContainer.querySelector('.workspace-leaf.is-maximized')) return;
    app.workspace.setActiveLeaf(ownLeaf, { focus: false });
}
