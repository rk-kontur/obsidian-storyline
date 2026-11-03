// Pure helpers for the Timeline's empty acts and empty volumes, plus the
// placeholder card of a volume without scenes.
//
// Rules:
// - An act is "empty" exactly as the Timeline decides it without volumes:
//   no scene in the list it renders (active scenes, without corkboard
//   notes), restricted to the selected volume.
// - In act order (Reading order) empty acts and empty volumes are placed
//   between the acts, so each sits inside its volume band. In Chronological
//   order the acts interleave, so there are no volume bands and placeholders
//   stay at the end, as without volumes.

import { actNumber, type VolumeDef } from './volumes';
import type { VolumeDividerTracker } from './volumeBands';

/** Defined acts without a scene in the base list (compared as Number(act), like the Timeline). */
export function emptyTimelineActs(definedActs: number[], baseSceneActs: unknown[]): number[] {
    const withScenes = new Set<number>();
    for (const a of baseSceneActs) {
        if (a !== undefined) withScenes.add(Number(a));
    }
    return definedActs.filter(a => !withScenes.has(Number(a)));
}

/** First act of a volume (a volume always has at least one act). */
export function firstVolumeAct(vol: VolumeDef): number {
    return Math.min(...vol.acts);
}

/**
 * Volumes that need an "empty volume" placeholder: no scene of the base list
 * is in the volume, and none of its acts already shows an empty-act
 * placeholder (that placeholder carries the band).
 * Candidates: the selected volume, or, under "All volumes" and only in act
 * order, every volume.
 */
export function emptyTimelineVolumes(
    volumes: VolumeDef[],
    scoped: VolumeDef | undefined,
    baseSceneActs: unknown[],
    emptyActs: number[],
    actOrder: boolean,
): VolumeDef[] {
    const candidates = scoped ? [scoped] : (actOrder ? volumes : []);
    const used = new Set<number>();
    for (const a of baseSceneActs) {
        const n = actNumber(a);
        if (n !== undefined) used.add(n);
    }
    const placeholders = new Set(emptyActs.map(Number));
    return candidates.filter(vol =>
        !vol.acts.some(a => used.has(a)) && !vol.acts.some(a => placeholders.has(a)));
}

/** Minimal shape of a Timeline item for placement by act. */
export interface ActPlacedItem {
    kind: string;
    actNum?: number;
}

/**
 * Insert `extras` (empty acts, empty volumes) into the rendered items.
 * In act order each extra goes before the first act divider ('divider') of
 * a later act; dividers of non-numeric acts and "No Act" sort last in
 * reading order, so extras go before them too. Otherwise (chronological)
 * extras are appended, as without volumes.
 */
export function mergeByAct<T extends ActPlacedItem>(items: T[], extras: T[], actOrder: boolean): T[] {
    const sorted = [...extras].sort((a, b) => (a.actNum ?? Infinity) - (b.actNum ?? Infinity));
    if (!actOrder) return [...items, ...sorted];
    const out: T[] = [];
    let e = 0;
    for (const item of items) {
        if (item.kind === 'divider') {
            const act = item.actNum;
            while (e < sorted.length && (act === undefined || !Number.isFinite(act) || act > (sorted[e].actNum ?? Infinity))) {
                out.push(sorted[e++]);
            }
        }
        out.push(item);
    }
    while (e < sorted.length) out.push(sorted[e++]);
    return out;
}

/**
 * Placeholder of a volume without scenes: its band (when the tracker is
 * active) and an empty card in the style of the empty-act card.
 * Clicking the card adds a scene to the volume's first act.
 */
export function renderEmptyVolumeEntry(
    parent: HTMLElement,
    vol: VolumeDef,
    tracker: VolumeDividerTracker,
    onAdd: (act: number) => void,
    gridColumn?: string,
): void {
    tracker.renderVolume(parent, vol, gridColumn);
    const entry = parent.createDiv('timeline-entry timeline-entry-empty');
    if (gridColumn) entry.setCssStyles({ gridColumn });
    const card = entry.createDiv('timeline-entry-card').createDiv('timeline-card timeline-card-empty');
    card.createDiv({ cls: 'timeline-card-title', text: `No scenes in ${vol.title}` });
    card.createEl('p', { cls: 'timeline-card-hint', text: 'Click to add a scene' });
    const act = firstVolumeAct(vol);
    card.addEventListener('click', () => onAdd(act));
}
