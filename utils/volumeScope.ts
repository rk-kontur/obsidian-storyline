// Shared volume selection ("All volumes / Volume 1 / …") for all views.
//
// Pick "Volume 2" in any view and Board, Plot Grid, Timeline, Plotlines,
// Manuscript and Navigator show only the acts of that volume; Characters,
// Locations and Codex list only its scenes. The selection is stored per
// project (local storage, keyed by the project file); '' means "All volumes".
// Scenes without an act stay visible in every volume. It is implemented as an
// act restriction merged into the SceneFilter each view already passes to
// getFilteredScenes, so the query service itself is unchanged. Without
// `volumes:` in the project nothing is selected and every helper here returns
// its input unchanged.

import { TFile, type App } from 'obsidian';
import type SceneCardsPlugin from '../main';
import type { Scene, SceneFilter } from '../models/Scene';
import { actNumber, getProjectVolumes, getVolumeForAct, type VolumeDef } from './volumes';

const STORAGE_KEY = 'storyline-volume-scope';

/** Per project, so switching books in a series does not carry the selection over. */
function storageKey(projectFilePath: string | undefined | null): string {
    return `${STORAGE_KEY}:${projectFilePath ?? ''}`;
}

/** Id of the selected volume of a project, '' for "All volumes". */
export function getVolumeScope(app: App, projectFilePath: string | undefined | null): string {
    ensureDropdownsFollowProject();
    const v: unknown = app.loadLocalStorage(storageKey(projectFilePath));
    return typeof v === 'string' ? v : '';
}

/** Set by setVolumeScope, consumed by the next refresh of the open views: views start at the top. */
let scrollResetPending = false;

/**
 * Store the selection for the CURRENT project and refresh all views. Ids the
 * current project does not define (e.g. from a dropdown that still showed the
 * previous book) are rejected, so no foreign id is stored for this project.
 */
export function setVolumeScope(plugin: SceneCardsPlugin, id: string): void {
    const projectFilePath = plugin.sceneManager?.activeProject?.filePath;
    if (id && !getProjectVolumes(plugin.app, projectFilePath).some(v => v.id === id)) {
        syncVolumeScopeSelects(plugin);
        return;
    }
    if (id !== getVolumeScope(plugin.app, projectFilePath)) scrollResetPending = true;
    plugin.app.saveLocalStorage(storageKey(projectFilePath), id);
    syncVolumeScopeSelects(plugin);
    void plugin.refreshOpenViews();
}

function clearVolumeScope(app: App, projectFilePath: string | undefined | null): void {
    app.saveLocalStorage(storageKey(projectFilePath), '');
}

/** Back to "All volumes" if the selection is the given (deleted) volume. */
export function clearVolumeScopeIfId(app: App, projectFilePath: string | undefined | null, id: string): void {
    if (id && getVolumeScope(app, projectFilePath) === id) {
        clearVolumeScope(app, projectFilePath);
        scrollResetPending = true;
    }
}

/**
 * Called before the open views refresh: updates every volume dropdown and
 * returns true once after the selection changed (the views then start at
 * the top instead of restoring their scroll position).
 */
export function prepareVolumeScopeRefresh(plugin: SceneCardsPlugin): boolean {
    syncVolumeScopeSelects(plugin);
    const pending = scrollResetPending;
    scrollResetPending = false;
    return pending;
}

/**
 * True if the selected volume changed since the last call for this owner (a
 * view), and records the current one. Called when a view renders and in its
 * refresh(), which then skips its "just saved" grace window. The first call
 * only records; without volumes in the project it is always false.
 */
const lastScopeKeys = new WeakMap<object, string>();
export function volumeScopeChanged(owner: object, plugin: SceneCardsPlugin): boolean {
    const projectFilePath = plugin.sceneManager?.activeProject?.filePath;
    const hasVolumes = getProjectVolumes(plugin.app, projectFilePath).length > 0;
    const key = `${projectFilePath ?? ''}|${scopedVolumeId(plugin.app, projectFilePath)}`;
    const prev = lastScopeKeys.get(owner);
    lastScopeKeys.set(owner, key);
    return hasVolumes && prev !== undefined && prev !== key;
}

/** Id of the selected volume that exists in the project, '' for "All volumes" (or no volumes). */
export function scopedVolumeId(app: App, projectFilePath: string | undefined | null): string {
    return getScopedVolume(app, projectFilePath)?.id ?? '';
}

/** The selected volume, or undefined for "All volumes" / an unknown id. */
export function getScopedVolume(app: App, projectFilePath: string | undefined | null): VolumeDef | undefined {
    const id = getVolumeScope(app, projectFilePath);
    if (!id) return undefined;
    return getProjectVolumes(app, projectFilePath).find(v => v.id === id);
}

/**
 * Distinct raw act values (as matchesFilter compares them: String(act)) of
 * the project's scenes that are numerically in the volume, e.g. "05" for
 * act 5. Only for the active project of the bound plugin.
 */
function sceneActStringsInVolume(projectFilePath: string | undefined | null, vol: VolumeDef): string[] {
    const sm = boundPlugin?.sceneManager;
    if (!sm || (sm.activeProject?.filePath ?? null) !== (projectFilePath ?? null)) return [];
    const acts = new Set(vol.acts);
    const out = new Set<string>();
    for (const s of sm.getAllScenes()) {
        if (s.act === undefined) continue;
        const n = actNumber(s.act);
        if (n !== undefined && acts.has(n)) out.add(String(s.act));
    }
    return [...out];
}

/**
 * Merge the selected volume into a SceneFilter (intersection with an act
 * filter). Returns the filter itself when no volume is selected.
 *
 * Membership is numeric (actNumber): "05" and 5 are act 5, Prologue (0),
 * Epilogue (99) and non-numeric acts are in no volume. matchesFilter
 * compares strings, so the act list holds the volume's acts plus every raw
 * act value of the project's scenes that is numerically in the volume, and
 * '' so that scenes without an act stay visible.
 */
export function scopeFilter<T extends SceneFilter | undefined>(
    app: App,
    projectFilePath: string | undefined | null,
    filter: T,
): T | SceneFilter {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return filter;
    const volActs = new Set(vol.acts);
    const inVol = (a: unknown) => { const n = actNumber(a); return n !== undefined && volActs.has(n); };
    const base = filter?.act?.length
        ? filter.act.map(String).filter(inVol)
        : [...new Set([...vol.acts.map(String), ...sceneActStringsInVolume(projectFilePath, vol)]), ''];
    // An empty intersection must match nothing, not everything
    return { ...(filter ?? {}), act: base.length ? base : ['__none__'] };
}

/**
 * True if a scene with this act is inside the volume under the rule of
 * scopeFilter: no act (undefined or '') is inside every volume, otherwise the
 * act must be numerically one of the volume's acts.
 */
export function actInVolumeScope(vol: VolumeDef, act: unknown): boolean {
    if (act === undefined || act === '') return true;
    const n = actNumber(act);
    return n !== undefined && vol.acts.includes(n);
}

/**
 * Scene predicate for the selected volume (always true without one), the
 * same set as scopeFilter. Resolved once: use it outside loops.
 */
export function volumeScopePredicate(app: App, projectFilePath: string | undefined | null): (scene: Scene) => boolean {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return () => true;
    return (scene: Scene) => actInVolumeScope(vol, scene.act);
}

/** Scenes of the selected volume (all scenes without one). */
export function scopeScenes<T extends Scene>(plugin: SceneCardsPlugin, scenes: T[]): T[] {
    const inScope = volumeScopePredicate(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    return scenes.filter(inScope);
}

/**
 * "Referenced by" lists: drop scene references outside the selected volume.
 * References from characters, locations and codex entries are kept.
 */
export function scopeSceneRefs<T extends { type: string; filePath: string }>(plugin: SceneCardsPlugin, refs: T[]): T[] {
    const inScope = volumeScopePredicate(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    return refs.filter(ref => {
        if (ref.type !== 'scene') return true;
        const scene = plugin.sceneManager?.getScene(ref.filePath);
        return !scene || inScope(scene);
    });
}

/** First act of the selected volume: default act for scenes created while a volume is selected. */
export function defaultActForScope(app: App, projectFilePath: string | undefined | null): number | undefined {
    return getScopedVolume(app, projectFilePath)?.acts[0];
}

/**
 * For views that renumber a global counter from a scoped list (Timeline
 * chronological order): moves `moved` inside the FULL list to the position
 * it got in the scoped list (before `next`, else after `prev`).
 */
export function placeInFullList<T extends { filePath: string }>(full: T[], moved: T, prev: T | undefined, next: T | undefined): T[] {
    const list = full.filter(s => s.filePath !== moved.filePath);
    let idx = list.length;
    if (next) {
        const i = list.findIndex(s => s.filePath === next.filePath);
        if (i >= 0) idx = i;
    } else if (prev) {
        const i = list.findIndex(s => s.filePath === prev.filePath);
        if (i >= 0) idx = i + 1;
    }
    list.splice(idx, 0, moved);
    return list;
}

/** Restrict a list of act numbers to the selected volume. */
export function scopeActs(app: App, projectFilePath: string | undefined | null, acts: number[]): number[] {
    const vol = getScopedVolume(app, projectFilePath);
    return vol ? acts.filter(a => vol.acts.includes(a)) : acts;
}

/**
 * Cache key for a view that caches the scenes of scopeFilter(filter)
 * (Manuscript): the selected volume, its acts and the merged act list
 * (including raw spellings like "05"), so a changed `acts:` or a changed act
 * spelling invalidates the cache. '' without a selected volume.
 */
export function volumeScopeFilterKey(app: App, projectFilePath: string | undefined | null, filter: SceneFilter | undefined): string {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return '';
    const scoped = scopeFilter(app, projectFilePath, filter);
    return `vol:${vol.id}|acts:${JSON.stringify(vol.acts)}|scope:${JSON.stringify(scoped?.act ?? [])}`;
}

// ── Self-updating dropdowns ─────────────────────────
// Every rendered dropdown is registered here. syncVolumeScopeSelects updates
// options, value and visibility of all of them for the CURRENT project, so a
// view that does not rebuild its toolbar on refresh never shows a stale
// volume list or value.

interface ScopeSelect {
    select: HTMLSelectElement;
    /** Element hidden while the project has no volumes (the select or its "Filter by" wrapper). */
    host: HTMLElement;
    created: number;
    /** Was in the document once; gone from it afterwards means the view re-rendered or closed. */
    wasConnected: boolean;
}

const registry = new Set<ScopeSelect>();
/** A dropdown that never reached the document within this time is dropped. */
const ATTACH_GRACE_MS = 10000;

function pruneRegistry(now = Date.now()): void {
    for (const entry of [...registry]) {
        if (entry.select.isConnected) entry.wasConnected = true;
        else if (entry.wasConnected || now - entry.created > ATTACH_GRACE_MS) registry.delete(entry);
    }
}

function syncOne(entry: ScopeSelect, volumes: VolumeDef[], current: string): void {
    const { select, host } = entry;
    const wanted = [{ id: '', title: 'All volumes' }, ...volumes.map(v => ({ id: v.id, title: v.title }))];
    const same = select.options.length === wanted.length
        && wanted.every((w, i) => select.options[i].value === w.id && select.options[i].text === w.title);
    if (!same) {
        select.empty();
        for (const w of wanted) select.createEl('option', { text: w.title, value: w.id });
    }
    const value = volumes.some(v => v.id === current) ? current : '';
    if (select.value !== value) select.value = value;
    host.toggle(volumes.length > 0);
}

/** Plugin bound by registerVolumeScopeSync, and the project the dropdowns were last synced for. */
let boundPlugin: SceneCardsPlugin | null = null;
let syncedProject: string | null | undefined;
/** Effective selection at the last sync: "project|id|acts", or '' without a valid volume. */
let syncedScopeSig = '';

/** Update every rendered volume dropdown to the current project's volumes and selection. */
export function syncVolumeScopeSelects(plugin: SceneCardsPlugin): void {
    const projectFilePath = plugin.sceneManager?.activeProject?.filePath;
    syncedProject = projectFilePath ?? null; // before getVolumeScope, which checks it
    const volumes = getProjectVolumes(plugin.app, projectFilePath);
    let current = getVolumeScope(plugin.app, projectFilePath);
    // Stored id of a volume that no longer exists (also when `volumes:` is gone
    // entirely): back to "All volumes", so a later volume that gets the same id
    // is not selected silently. Not before the project file is indexed: at
    // startup its volumes may simply not be known yet.
    const indexed = volumes.length > 0 || isProjectFileIndexed(plugin.app, projectFilePath);
    if (current && indexed && !volumes.some(v => v.id === current)) {
        clearVolumeScope(plugin.app, projectFilePath);
        current = '';
    }
    const vol = volumes.find(v => v.id === current);
    syncedScopeSig = vol ? `${projectFilePath ?? ''}|${vol.id}|${JSON.stringify(vol.acts)}` : '';
    pruneRegistry();
    for (const entry of registry) syncOne(entry, volumes, current);
}

/** True once the metadata cache has the project file (its `volumes:` are known). */
function isProjectFileIndexed(app: App, projectFilePath: string | undefined | null): boolean {
    if (!projectFilePath) return false;
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    return file instanceof TFile && app.metadataCache.getFileCache(file) !== null;
}

/**
 * Sync the dropdowns; if the effective selection changed (e.g. the metadata
 * cache indexed the project file only after the views rendered, or the
 * volume's acts changed), refresh the views too. The refresh syncs again,
 * which updates the signature: no loop.
 */
function syncAndRefreshIfScopeChanged(plugin: SceneCardsPlugin): void {
    const before = syncedScopeSig;
    syncVolumeScopeSelects(plugin);
    if (syncedScopeSig !== before) void plugin.refreshOpenViews();
}

/** Cheap check on every read: the active project changed since the last sync, sync the dropdowns. */
function ensureDropdownsFollowProject(): void {
    if (!boundPlugin) return;
    const project = boundPlugin.sceneManager?.activeProject?.filePath ?? null;
    if (project !== syncedProject) syncVolumeScopeSelects(boundPlugin);
}

/**
 * Keep the dropdowns current when the project file's `volumes:` change, when
 * the metadata cache becomes ready after the views were opened, and when the
 * active project changes. Call once in onload.
 */
export function registerVolumeScopeSync(plugin: SceneCardsPlugin): void {
    boundPlugin = plugin;
    plugin.registerEvent(plugin.app.metadataCache.on('changed', (file) => {
        if (file.path === plugin.sceneManager?.activeProject?.filePath) syncAndRefreshIfScopeChanged(plugin);
    }));
    plugin.registerEvent(plugin.app.metadataCache.on('resolved', () => syncAndRefreshIfScopeChanged(plugin)));
    plugin.registerEvent(plugin.app.workspace.on('active-leaf-change', () => ensureDropdownsFollowProject()));
    plugin.registerEvent(plugin.app.workspace.on('layout-change', () => ensureDropdownsFollowProject()));
    plugin.register(() => { boundPlugin = null; registry.clear(); syncedScopeSig = ''; });
}

function createScopeSelect(parent: HTMLElement, plugin: SceneCardsPlugin, host?: HTMLElement): HTMLSelectElement {
    pruneRegistry(); // dropdowns of the previous render of this view are gone now
    const select = parent.createEl('select', {
        cls: 'dropdown story-line-volume-scope',
        attr: { 'aria-label': 'Volume' },
    });
    const entry: ScopeSelect = { select, host: host ?? select, created: Date.now(), wasConnected: false };
    registry.add(entry);
    const projectFilePath = plugin.sceneManager?.activeProject?.filePath;
    syncOne(entry, getProjectVolumes(plugin.app, projectFilePath), getVolumeScope(plugin.app, projectFilePath));
    select.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation());
    select.addEventListener('change', () => setVolumeScope(plugin, select.value));
    return select;
}

/**
 * Toolbar dropdown "All volumes / Volume 1 / …". Hidden while the project
 * defines no volumes; it shows up by itself as soon as volumes exist.
 */
export function renderVolumeScopeSelect(parent: HTMLElement, plugin: SceneCardsPlugin): void {
    createScopeSelect(parent, plugin);
}

/**
 * Filter bar version: "Filter by [Volume]" at the very left of the filter bar
 * (Board, Manuscript, Plot Grid). Hidden while no volumes exist.
 */
export function renderVolumeFilterBarStart(bar: HTMLElement, plugin: SceneCardsPlugin): void {
    const wrap = bar.createDiv('story-line-filter-by');
    wrap.createSpan({ cls: 'story-line-filter-by-label', text: 'Filter by' });
    createScopeSelect(wrap, plugin, wrap);
    bar.prepend(wrap);
}

/** Short volume badge text, e.g. "V2", from the title's number if it ends in one. */
function volumeBadgeText(volumes: VolumeDef[], vol: VolumeDef): string {
    const num = vol.title.match(/(\d+)\s*$/)?.[1];
    return num ? `V${num}` : `V${volumes.indexOf(vol) + 1}`;
}

/** Small "V2" badge in a scene card header. Renders nothing without volumes. */
export function renderVolumeBadge(parent: HTMLElement, plugin: SceneCardsPlugin, scene: Scene): void {
    if (scene.act === undefined) return;
    const volumes = getProjectVolumes(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    if (volumes.length === 0) return;
    const vol = getVolumeForAct(volumes, scene.act);
    if (!vol) return;
    parent.createSpan({ cls: 'story-line-volume-badge', text: volumeBadgeText(volumes, vol), attr: { title: vol.title } });
}
