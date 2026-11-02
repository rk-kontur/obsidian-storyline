// Command "Manage volumes": opens "Manage story structure" at its Volumes
// section. It can get a hotkey in Settings → Hotkeys.

import type SceneCardsPlugin from '../main';
import { BOARD_VIEW_TYPE, TIMELINE_VIEW_TYPE } from '../constants';
import { flushOpenVolumeEditors, revealNextVolumesSection } from '../components/VolumesEditor';
import { BoardView } from '../views/BoardView';
import { TimelineView } from '../views/TimelineView';

/**
 * Open the "Manage story structure" dialog at its Volumes section from
 * anywhere: uses an open Board or Timeline view, otherwise opens the Board
 * in a new tab, so the current tab stays where it is.
 */
export async function openVolumesDialog(plugin: SceneCardsPlugin): Promise<void> {
    revealNextVolumesSection();
    const { workspace } = plugin.app;
    const find = () => workspace.getLeavesOfType(BOARD_VIEW_TYPE)[0] ?? workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0];
    let leaf = find();
    try {
        if (!leaf) {
            await workspace.getLeaf('tab').setViewState({ type: BOARD_VIEW_TYPE, active: true });
            leaf = find();
        }
        if (leaf) await leaf.loadIfDeferred(); // deferred tabs have no real view yet
        const view = leaf?.view;
        if (view instanceof BoardView || view instanceof TimelineView) {
            view.openStructureModal();
            return;
        }
    } catch (e) {
        console.error('StoryLine: could not open the structure dialog', e);
    }
    // No dialog opened: do not scroll on some later, unrelated opening
    revealNextVolumesSection(false);
}

export function registerStructureCommands(plugin: SceneCardsPlugin): void {
    plugin.addCommand({
        id: 'manage-volumes',
        name: 'Manage volumes',
        callback: () => { void openVolumesDialog(plugin); },
    });
    // A volumes change still waiting for its debounce is written on unload
    plugin.register(() => { void flushOpenVolumeEditors(); });
}
