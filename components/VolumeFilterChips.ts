// A volume chip is a shortcut for "all acts of this volume" in the existing
// act filter (SceneFilter.act). No new filter dimension, no change to
// SceneQueryService.matchesFilter.

import { Setting } from 'obsidian';
import type { SceneFilter } from '../models/Scene';
import { actNumber, type VolumeDef } from '../utils/volumes';

export function renderVolumeFilterChips(
    panel: HTMLElement,
    volumes: VolumeDef[],
    filter: SceneFilter,
    actValues: string[],
    actContainer: HTMLElement,
    onChange: () => void,
): void {
    if (volumes.length === 0) return;

    // Only acts that actually exist in the project count for a volume. Numeric
    // match like the volume scope, so "05" and "5" both belong to act 5.
    const actsOf = (v: VolumeDef) => actValues.filter(a => {
        const n = actNumber(a);
        return n !== undefined && v.acts.includes(n);
    });
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
        // Act chips are rendered one per act value, in order: match by position,
        // not by label ("5" and "05" both show "Act 5").
        actContainer.querySelectorAll('button.story-line-chip').forEach((btn, i) => {
            const act = actValues[i];
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
