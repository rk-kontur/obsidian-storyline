// ═══════════════════════════════════════════════════════
//  Volume filter chips (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// A volume chip is a shortcut for "all acts of this volume" in the existing
// act filter (SceneFilter.act). No new filter dimension, no change to
// SceneQueryService.matchesFilter.

import { Setting } from 'obsidian';
import type { SceneFilter } from '../models/Scene';
import { getActDisplayLabel } from '../utils/actChapter';
import type { VolumeDef } from '../utils/volumes';

export function renderVolumeFilterChips(
    panel: HTMLElement,
    volumes: VolumeDef[],
    filter: SceneFilter,
    actValues: string[],
    actContainer: HTMLElement,
    onChange: () => void,
): void {
    if (volumes.length === 0) return;

    // Only acts that actually exist in the project count for a volume.
    const existing = new Set(actValues.map(String));
    const actsOf = (v: VolumeDef) => v.acts.map(String).filter(a => existing.has(a));
    const usable = volumes.filter(v => actsOf(v).length > 0);
    if (usable.length === 0) return;

    new Setting(panel).setName('Volume');
    const container = panel.createDiv('story-line-filter-chips');
    const chips: { vol: VolumeDef; chip: HTMLElement }[] = [];

    const isActive = (v: VolumeDef) => {
        const selected = new Set((filter.act ?? []).map(String));
        return actsOf(v).every(a => selected.has(a));
    };

    const syncActChips = () => {
        const selected = new Set((filter.act ?? []).map(String));
        actContainer.querySelectorAll('button.story-line-chip').forEach(btn => {
            const act = actValues.find(a => getActDisplayLabel(a) === btn.textContent);
            if (act !== undefined) btn.toggleClass('active', selected.has(String(act)));
        });
    };

    const syncVolumeChips = () => {
        for (const { vol, chip } of chips) chip.toggleClass('active', isActive(vol));
    };

    for (const vol of usable) {
        const chip = container.createEl('button', { cls: 'story-line-chip', text: vol.title });
        chips.push({ vol, chip });
        chip.addEventListener('click', () => {
            const acts = actsOf(vol);
            const current = (filter.act ?? []).map(String);
            if (isActive(vol)) {
                filter.act = (filter.act ?? []).filter(a => !acts.includes(String(a)));
            } else {
                filter.act = [...(filter.act ?? []), ...acts.filter(a => !current.includes(a))];
            }
            syncActChips();
            syncVolumeChips();
            onChange();
        });
    }
    syncVolumeChips();

    // Keep volume chips in sync when single act chips are toggled.
    actContainer.addEventListener('click', () => window.setTimeout(syncVolumeChips, 0));
}
