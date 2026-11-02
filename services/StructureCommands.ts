// Commands "Manage story structure" and "Manage volumes". They can get a
// hotkey in Settings → Hotkeys.

import type SceneCardsPlugin from '../main';
import { BOARD_VIEW_TYPE, TIMELINE_VIEW_TYPE } from '../constants';
import { clearNextStructureSection, setNextStructureSection, type StructureSection } from '../components/StructureModalSections';
import { flushOpenVolumeEditors } from '../components/VolumesEditor';
import { BoardView } from '../views/BoardView';
import { TimelineView } from '../views/TimelineView';

/**
 * Open the "Manage story structure" dialog from anywhere: uses an open Board
 * or Timeline view, otherwise opens the Board in a new tab, so the current
 * tab stays where it is. `section` is opened in the dialog.
 */
export async function openStructureDialog(plugin: SceneCardsPlugin, section?: StructureSection): Promise<void> {
    if (section) setNextStructureSection(plugin.app, section);
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
    // No dialog opened: do not force the section open on some later, unrelated opening
    if (section) clearNextStructureSection(plugin.app);
}

export function registerStructureCommands(plugin: SceneCardsPlugin): void {
    plugin.addCommand({
        id: 'manage-story-structure',
        name: 'Manage story structure',
        callback: () => { void openStructureDialog(plugin); },
    });
    plugin.addCommand({
        id: 'manage-volumes',
        name: 'Manage volumes',
        callback: () => { void openStructureDialog(plugin, 'volumes'); },
    });
    // A volumes change still waiting for its debounce is written on unload
    plugin.register(() => { void flushOpenVolumeEditors(); });
}
