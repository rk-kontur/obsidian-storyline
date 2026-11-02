import { setIcon } from 'obsidian';
import type SceneCardsPlugin from '../main';
import { isSectionCollapsed, rememberSectionState } from '../settings';

/** States changed in this session, shared by the Board and Timeline dialogs. */
const sessionStates = new Map<string, boolean>();

/**
 * Create one collapsible section of the "Manage story structure" dialog and
 * return its body. The initial state follows the "Default section state"
 * setting (expanded by default); changes are kept for the session and saved
 * when the setting is "Remember last state".
 */
export function createStructureSection(
    parent: HTMLElement,
    plugin: SceneCardsPlugin,
    id: string,
    title: string,
): HTMLElement {
    const key = `structure:${id}`;
    let collapsed = sessionStates.get(key) ?? isSectionCollapsed(plugin.settings, key);

    const details = parent.createEl('details', { cls: 'structure-section' });
    details.open = !collapsed;
    const summary = details.createEl('summary', { cls: 'structure-section-summary' });
    setIcon(summary.createSpan('structure-section-icon'), 'chevron-down');
    summary.createEl('h3', { text: title });

    details.addEventListener('toggle', () => {
        if (collapsed === !details.open) return;
        collapsed = !details.open;
        sessionStates.set(key, collapsed);
        rememberSectionState(plugin.settings, key, collapsed);
        if (plugin.settings.sectionDefaultState === 'remember') void plugin.saveSettings();
    });

    return details.createDiv('structure-section-body');
}
