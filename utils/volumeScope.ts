// ═══════════════════════════════════════════════════════
//  Shared volume scope (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// One "current volume" for all views: pick "Volume 2" in any toolbar and
// Board, Corkboard, Plot Grid, Timeline, Subway, Manuscript and Navigator
// all show only the acts of that volume. Stored per vault (local storage),
// '' means "All volumes". Implemented as an act restriction merged into the
// SceneFilter each view already passes to getFilteredScenes, so the query
// service itself is unchanged.

import type { App } from 'obsidian';
import type SceneCardsPlugin from '../main';
import type { Scene, SceneFilter } from '../models/Scene';
import { getProjectVolumes, getVolumeForAct, type VolumeDef } from './volumes';

const STORAGE_KEY = 'storyline-km:volumeScope';

export function getVolumeScope(app: App): string {
    const v: unknown = app.loadLocalStorage(STORAGE_KEY);
    return typeof v === 'string' ? v : '';
}

export function setVolumeScope(plugin: SceneCardsPlugin, id: string): void {
    plugin.app.saveLocalStorage(STORAGE_KEY, id);
    plugin.refreshOpenViews();
}

/** The scoped volume, or undefined for "All volumes" / unknown id. */
export function getScopedVolume(app: App, projectFilePath: string | undefined | null): VolumeDef | undefined {
    const id = getVolumeScope(app);
    if (!id) return undefined;
    return getProjectVolumes(app, projectFilePath).find(v => v.id === id);
}

/**
 * Merge the volume scope into a SceneFilter (intersection with an existing
 * act filter). Returns the filter unchanged when no volume is scoped.
 */
export function scopeFilter<T extends SceneFilter | undefined>(
    app: App,
    projectFilePath: string | undefined | null,
    filter: T,
): T | SceneFilter {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return filter;
    const volActs = vol.acts.map(String);
    const base = filter?.act?.length ? filter.act.map(String).filter(a => volActs.includes(a)) : volActs;
    // Empty intersection must match nothing, not everything
    return { ...(filter ?? {}), act: base.length ? base : ['__none__'] };
}

/** True if the scene is inside the scoped volume (or no volume is scoped). */
export function inVolumeScope(app: App, projectFilePath: string | undefined | null, scene: Scene): boolean {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return true;
    return getVolumeForAct([vol], scene.act) !== undefined;
}

/** Restrict a list of act numbers to the scoped volume. */
export function scopeActs(app: App, projectFilePath: string | undefined | null, acts: number[]): number[] {
    const vol = getScopedVolume(app, projectFilePath);
    return vol ? acts.filter(a => vol.acts.includes(a)) : acts;
}

/** Key fragment for view-level caches that must invalidate on scope change. */
export function volumeScopeKey(app: App): string {
    return `vol:${getVolumeScope(app)}`;
}

/**
 * Toolbar dropdown "All volumes / Volume 1 / …". Rendered only when the
 * project defines volumes. Changing it re-renders every open StoryLine view.
 */
export function renderVolumeScopeSelect(parent: HTMLElement, plugin: SceneCardsPlugin): void {
    const volumes = getProjectVolumes(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    if (volumes.length === 0) return;
    const select = parent.createEl('select', {
        cls: 'dropdown sl-km-volume-scope',
        attr: { 'aria-label': 'Volume' },
    });
    select.createEl('option', { text: 'All volumes', value: '' });
    for (const v of volumes) select.createEl('option', { text: v.title, value: v.id });
    const current = getVolumeScope(plugin.app);
    select.value = volumes.some(v => v.id === current) ? current : '';
    select.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation());
    select.addEventListener('change', () => setVolumeScope(plugin, select.value));
}

/** Short volume badge text, e.g. "V2" for the 2nd volume, from the title's number if present. */
export function volumeBadgeText(volumes: VolumeDef[], vol: VolumeDef): string {
    const num = vol.title.match(/(\d+)\s*$/)?.[1];
    return num ? `V${num}` : `V${volumes.indexOf(vol) + 1}`;
}

/** Small "V2" badge in a scene card header (Kanban and Corkboard). No-op without volumes. */
export function renderVolumeBadge(parent: HTMLElement, plugin: SceneCardsPlugin, scene: Scene): void {
    if (scene.act === undefined) return;
    const volumes = getProjectVolumes(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    if (volumes.length === 0) return;
    const vol = getVolumeForAct(volumes, scene.act);
    if (!vol) return;
    parent.createSpan({ cls: 'sl-km-volume-badge', text: volumeBadgeText(volumes, vol), attr: { title: vol.title } });
}
