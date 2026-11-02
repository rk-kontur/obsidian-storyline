// ═══════════════════════════════════════════════════════
//  Commands added by the fork (storyline-km)
// ═══════════════════════════════════════════════════════
//
// Registered with one call from main.ts onload: registerForkCommands(this).
// Also registers the fork's onload event hooks (volume dropdown sync).
// Commands can get a hotkey in Settings → Hotkeys.

import type SceneCardsPlugin from '../main';
import { BOARD_VIEW_TYPE, TIMELINE_VIEW_TYPE } from '../constants';
import { clearNextStructureSection, setNextStructureSection, type StructureSection } from '../components/StructureModalSections';
import { registerVolumeScopeSync } from '../utils/volumeScope';
import { flushOpenVolumeEditors } from '../components/VolumesEditor';
import { registerRealizedByRenameSync } from './RealizedByRenameSync';

interface HasStructureModal { openStructureModal(): void }

/**
 * Open the "Manage story structure" dialog from anywhere: uses an open Board
 * or Timeline view, otherwise opens the Board in a new tab, so the current
 * tab (e.g. Statistics) stays where it is.
 */
export async function openStructureDialog(plugin: SceneCardsPlugin, section?: StructureSection): Promise<void> {
    if (section) setNextStructureSection(plugin.app, section);
    const { workspace } = plugin.app;
    const find = () => workspace.getLeavesOfType(BOARD_VIEW_TYPE)[0] ?? workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0];
    let leaf = find();
    try {
        if (!leaf) {
            const tab = workspace.getLeaf('tab');
            await tab.setViewState({ type: BOARD_VIEW_TYPE, active: true });
            leaf = find();
        }
        if (leaf) await leaf.loadIfDeferred(); // deferred tabs have no real view yet
        const view = leaf?.view as unknown as Partial<HasStructureModal> | undefined;
        if (view && typeof view.openStructureModal === 'function') {
            view.openStructureModal();
            return;
        }
    } catch (e) {
        console.error('StoryLine: could not open the structure dialog', e);
    }
    // No dialog opened: do not force the section open on some later, unrelated opening
    if (section) clearNextStructureSection(plugin.app);
}

export function registerForkCommands(plugin: SceneCardsPlugin): void {
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
    // Volume dropdowns follow changes of the project file's `volumes:`
    registerVolumeScopeSync(plugin);
    // A volumes change still waiting for its debounce is written on unload
    plugin.register(() => { void flushOpenVolumeEditors(); });
    // Arc Point realizedBy links follow renamed files while Obsidian does not update links itself
    registerRealizedByRenameSync(plugin);
}
