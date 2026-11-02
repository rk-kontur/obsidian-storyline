/**
 * StructureCommand — "Manage story structure" command.
 *
 * Opens the structure dialog of the active Board or Timeline view, otherwise
 * of an open Board (before Timeline). If neither is open, the Board is opened
 * in a new tab, so the current tab stays.
 */

import type SceneCardsPlugin from '../main';
import { BOARD_VIEW_TYPE, TIMELINE_VIEW_TYPE } from '../constants';
import { BoardView } from '../views/BoardView';
import { TimelineView } from '../views/TimelineView';

async function openStructureDialog(plugin: SceneCardsPlugin): Promise<void> {
    const { workspace } = plugin.app;
    const active = workspace.getActiveViewOfType(BoardView) ?? workspace.getActiveViewOfType(TimelineView);
    if (active) {
        active.openStructureModal();
        return;
    }

    const find = () => workspace.getLeavesOfType(BOARD_VIEW_TYPE)[0] ?? workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0];

    let leaf = find();
    if (!leaf) {
        await workspace.getLeaf('tab').setViewState({ type: BOARD_VIEW_TYPE, active: true });
        leaf = find();
    }
    if (!leaf) return;

    // Tabs restored on startup are deferred and have no real view until loaded
    await leaf.loadIfDeferred();
    const view = leaf.view;
    if (view instanceof BoardView || view instanceof TimelineView) {
        view.openStructureModal();
    }
}

export function registerStructureCommand(plugin: SceneCardsPlugin): void {
    plugin.addCommand({
        id: 'manage-story-structure',
        name: 'Manage story structure',
        callback: () => { void openStructureDialog(plugin); },
    });
}
