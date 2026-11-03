// With a volume selected in the shared volume dropdown, the Navigator's
// plotline and chapter chips list only what occurs in that volume, and the
// progress bar shows that volume's progress. Without a selected volume the
// Navigator behaves exactly as before (these helpers are not used).
//
// The scope (local storage + the project's `volumes:`) is resolved once per
// render with resolveNavigatorScope (one read of each); everything else here
// is pure, so filtering on every search keystroke reads nothing per scene.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { compareActChapter } from './actChapter';
import { actInVolumeScope, getScopedVolume } from './volumeScope';
import type { VolumeDef } from './volumes';

export interface NavigatorScope {
    /** Selected volume, undefined = "All volumes" (or no volumes): unchanged behaviour. */
    volume: VolumeDef | undefined;
    /** Scene list and chips: the volume's scenes plus scenes without an act (as every view shows them). */
    inList: (scene: Scene) => boolean;
    /** Progress bar: only the volume's own scenes (scenes without an act left out). */
    inOwn: (scene: Scene) => boolean;
}

/** Resolve the volume scope once (one local storage read, one project frontmatter read). */
export function resolveNavigatorScope(app: App, projectFilePath: string | undefined | null): NavigatorScope {
    const volume = getScopedVolume(app, projectFilePath);
    if (!volume) return { volume, inList: () => true, inOwn: () => true };
    // Same rule as volumeScopePredicate, built from the volume already read
    // instead of reading the selection again.
    const noAct = (s: Scene) => s.act === undefined || s.act === '';
    return {
        volume,
        inList: (s) => noAct(s) || actInVolumeScope(volume, s.act),
        inOwn: (s) => !noAct(s) && actInVolumeScope(volume, s.act),
    };
}

export interface ChipData {
    /** Values in the Navigator's order (tags: string sort; chapters: compareActChapter). */
    values: string[];
    /** Active (not inactive, not corkboard note) scenes per value, as the Navigator counts them. */
    counts: Map<string, number>;
}

/**
 * Plotline chips over a scene subset: the same values as
 * getAllTags (tags of all given scenes, sorted) and the same counts as
 * the Navigator's per-row count, computed in one pass.
 */
export function collectTagChips(scenes: Iterable<Scene>): ChipData {
    const values = new Set<string>();
    const counts = new Map<string, number>();
    for (const s of scenes) {
        if (!s.tags) continue;
        const active = !s.corkboardNote && !s.inactive;
        for (const t of new Set(s.tags)) {
            values.add(t);
            if (active) counts.set(t, (counts.get(t) ?? 0) + 1);
        }
    }
    return { values: [...values].sort(), counts };
}

/**
 * Chapter chips over a scene subset: the same values as
 * getUniqueValues('chapter') (String(chapter), numeric-aware sort) and the
 * same counts as the Navigator's per-row count.
 */
export function collectChapterChips(scenes: Iterable<Scene>): ChipData {
    const values = new Set<string>();
    const counts = new Map<string, number>();
    for (const s of scenes) {
        if (s.chapter === undefined || s.chapter === null) continue;
        const key = String(s.chapter);
        values.add(key);
        if (!s.corkboardNote && !s.inactive) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { values: [...values].sort(compareActChapter), counts };
}

/** True if an active chip filter names a value the volume does not contain. */
export function filterOutsideVolume(filter: string | null, values: string[]): boolean {
    return filter !== null && !values.includes(filter);
}

/** Hint on a chip row whose filter value does not occur in the volume. */
export function outsideVolumeHint(vol: VolumeDef): string {
    return `not in ${vol.title}`;
}

/**
 * Empty scene list with a volume selected: say why, when an active chip
 * filter does not occur in the volume. Undefined = keep the default message.
 */
export function emptyListMessage(
    vol: VolumeDef | undefined,
    plotlineFilter: string | null,
    plotlineOutside: boolean,
    chapterFilter: string | null,
    chapterOutside: boolean,
): string | undefined {
    if (!vol) return undefined;
    if (plotlineFilter !== null && plotlineOutside) {
        return `No matching scenes: plotline "${plotlineFilter}" does not occur in ${vol.title}`;
    }
    if (chapterFilter !== null && chapterOutside) {
        return `No matching scenes: chapter ${chapterFilter} does not occur in ${vol.title}`;
    }
    return undefined;
}

/** Progress label with a volume selected: "Volume 2 · <label>". */
export function volumeProgressLabel(vol: VolumeDef | undefined, label: string): string {
    return vol ? `${vol.title} · ${label}` : label;
}

/** Tooltip of the progress bar with a volume selected. */
export function volumeProgressTooltip(vol: VolumeDef): string {
    return `Progress of ${vol.title}`;
}
