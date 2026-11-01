// ═══════════════════════════════════════════════════════
//  Commands added by the fork (storyline-km)
// ═══════════════════════════════════════════════════════
//
// Registered with one call from main.ts onload: registerForkCommands(this).
// Commands can get a hotkey in Settings → Hotkeys.

import type SceneCardsPlugin from '../main';
import { BOARD_VIEW_TYPE, TIMELINE_VIEW_TYPE } from '../constants';
import { setNextStructureTab, type StructureTab } from '../components/StructureModalTabs';

interface HasStructureModal { openStructureModal(): void }

/**
 * Open the "Manage story structure" dialog from anywhere: uses an open Board
 * or Timeline view, otherwise opens the Board first.
 */
export async function openStructureDialog(plugin: SceneCardsPlugin, tab?: StructureTab): Promise<void> {
    if (tab) setNextStructureTab(plugin.app, tab);
    const { workspace } = plugin.app;
    const find = () => workspace.getLeavesOfType(BOARD_VIEW_TYPE)[0] ?? workspace.getLeavesOfType(TIMELINE_VIEW_TYPE)[0];
    let leaf = find();
    if (!leaf) {
        await plugin.activateView(BOARD_VIEW_TYPE);
        leaf = find();
    }
    const view = leaf?.view as unknown as Partial<HasStructureModal> | undefined;
    if (view && typeof view.openStructureModal === 'function') view.openStructureModal();
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
}
