// ═══════════════════════════════════════════════════════
//  Shared volume scope (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// One "current volume" for all views: pick "Volume 2" in any toolbar and
// Board, Corkboard, Plot Grid, Timeline, Subway, Manuscript and Navigator
// all show only the acts of that volume. Stored per project (local storage,
// keyed by the project file), '' means "All volumes". Scenes without an act
// (e.g. corkboard notes) stay visible in every volume. Implemented as an act restriction merged into the
// SceneFilter each view already passes to getFilteredScenes, so the query
// service itself is unchanged.

import type { App } from 'obsidian';
import type SceneCardsPlugin from '../main';
import type { Scene, SceneFilter } from '../models/Scene';
import { actNumber, getProjectVolumes, getVolumeForAct, volumeIdNumber, type VolumeDef } from './volumes';

const STORAGE_KEY = 'storyline-km:volumeScope';

/** Per project, so switching books in a series does not carry the selection over. */
function storageKey(projectFilePath: string | undefined | null): string {
    return `${STORAGE_KEY}:${projectFilePath ?? ''}`;
}

export function getVolumeScope(app: App, projectFilePath: string | undefined | null): string {
    ensureDropdownsFollowProject();
    const v: unknown = app.loadLocalStorage(storageKey(projectFilePath));
    return typeof v === 'string' ? v : '';
}

/** Set by setVolumeScope, consumed by the next refreshOpenViews: views start at the top. */
let scrollResetPending = false;

/**
 * Store the scope for the CURRENT project and refresh all views. Ids that the
 * current project does not define (e.g. from a dropdown that still showed the
 * previous book) are rejected, so no foreign id lands under this project's key.
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

/** Clear the stored scope of a project ("All volumes"). */
export function clearVolumeScope(app: App, projectFilePath: string | undefined | null): void {
    app.saveLocalStorage(storageKey(projectFilePath), '');
}

/** Clear the stored scope if it points to the given (deleted) volume id. */
export function clearVolumeScopeIfId(app: App, projectFilePath: string | undefined | null, id: string): void {
    if (id && getVolumeScope(app, projectFilePath) === id) {
        clearVolumeScope(app, projectFilePath);
        scrollResetPending = true;
    }
}

/**
 * True once after the volume scope changed: refreshOpenViews then scrolls the
 * views to the top instead of restoring the old position.
 */
export function consumeVolumeScopeScrollReset(): boolean {
    const pending = scrollResetPending;
    scrollResetPending = false;
    return pending;
}

/**
 * New volume id: "v" + (highest number so far + 1). "So far" covers the
 * existing ids, ids deleted in this editing session, the stored scope id and
 * `seq`, the high-water mark kept in the project file (`volumeIdSeq`), so an
 * id the editor has once saved is never handed out again, on any device.
 */
export function nextVolumeId(existingIds: Iterable<string>, retiredIds: Iterable<string> = [], scopeId = '', seq = 0): string {
    let max = Math.max(0, seq);
    for (const id of [...existingIds, ...retiredIds, scopeId]) max = Math.max(max, volumeIdNumber(id));
    return `v${max + 1}`;
}

/**
 * True if the volume scope changed since the last call for this owner (a
 * view), and records the current key. Called in renderView (records what was
 * rendered) and in refresh(), which then bypasses its "just saved" grace
 * window when the volume was switched. The first call only records the key.
 */
const lastScopeKeys = new WeakMap<object, string>();
export function volumeScopeChanged(owner: object, plugin: SceneCardsPlugin): boolean {
    const key = `${plugin.sceneManager?.activeProject?.filePath ?? ''}|${volumeScopeKey(plugin.app, plugin.sceneManager?.activeProject?.filePath)}`;
    const prev = lastScopeKeys.get(owner);
    lastScopeKeys.set(owner, key);
    return prev !== undefined && prev !== key;
}

/** The scoped volume, or undefined for "All volumes" / unknown id. */
export function getScopedVolume(app: App, projectFilePath: string | undefined | null): VolumeDef | undefined {
    const id = getVolumeScope(app, projectFilePath);
    if (!id) return undefined;
    return getProjectVolumes(app, projectFilePath).find(v => v.id === id);
}

/**
 * Distinct raw act values (as matchesFilter compares them: String(act)) of
 * the project's scenes that are numerically in the volume, e.g. "05" or " 5"
 * for act 5. Only for the active project of the bound plugin; otherwise
 * (no plugin bound, other project) none.
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
 * Merge the volume scope into a SceneFilter (intersection with an existing
 * act filter). Returns the filter unchanged when no volume is scoped.
 *
 * Membership is numeric (actNumber): "05", " 5" and 5 are act 5, exactly as
 * getVolumeForAct (badges) and volumeScopePredicate decide. Upstream's
 * matchesFilter compares strings, so the act list holds the volume's acts
 * plus every raw act value of the project's scenes that is numerically in
 * the volume. Non-numeric acts ("Prologue") are in no volume.
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
    // An explicit act filter is intersected with the volume. Without one, '' keeps
    // scenes that have no act (corkboard notes, unassigned scenes) visible.
    const base = filter?.act?.length
        ? filter.act.map(String).filter(inVol)
        : [...new Set([...vol.acts.map(String), ...sceneActStringsInVolume(projectFilePath, vol)]), ''];
    // Empty intersection must match nothing, not everything
    return { ...(filter ?? {}), act: base.length ? base : ['__none__'] };
}

/**
 * True if a scene with this act is inside the volume under the scope rule of
 * scopeFilter: no act (undefined or '') is inside every volume, otherwise the
 * act must be numerically one of the volume's acts. Corkboard notes are not
 * special here (scopeFilter does not know them either). Used by the delete
 * and rename impact, which must count exactly what the views show.
 */
export function actInVolumeScope(vol: VolumeDef, act: unknown): boolean {
    if (act === undefined || act === '') return true;
    const n = actNumber(act);
    return n !== undefined && vol.acts.includes(n);
}

/**
 * True if the scene is inside the scoped volume (or no volume is scoped).
 * Same set as scopeFilter: scenes and corkboard notes without an act
 * (undefined or '') count as inside unless `keepUnassigned` is false
 * (Statistics: count only the volume's own scenes); everything else follows
 * its act (actNumber), Prologue/Epilogue and non-numeric acts are outside.
 */
export function inVolumeScope(app: App, projectFilePath: string | undefined | null, scene: Scene, keepUnassigned = true): boolean {
    return volumeScopePredicate(app, projectFilePath, keepUnassigned)(scene);
}

/**
 * Same rule as inVolumeScope, but the scope (local storage + `volumes:`) is
 * resolved once. Use it outside loops: `scenes.filter(volumeScopePredicate(...))`.
 */
export function volumeScopePredicate(
    app: App,
    projectFilePath: string | undefined | null,
    keepUnassigned = true,
): (scene: Scene) => boolean {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return () => true;
    return (scene: Scene) => {
        // Exactly the rule of scopeFilter: only undefined and '' are "no act"
        // (an empty `act:` key, null, is outside every volume); corkboard
        // notes follow their act like scenes.
        if (scene.act === undefined || scene.act === '') return keepUnassigned;
        return actInVolumeScope(vol, scene.act);
    };
}

/** Scenes of the scoped volume (all scenes without a scope). Entity views: scene lists and counts. */
export function scopeScenes<T extends Scene>(plugin: SceneCardsPlugin, scenes: T[]): T[] {
    const inScope = volumeScopePredicate(plugin.app, plugin.sceneManager?.activeProject?.filePath);
    return scenes.filter(inScope);
}

/**
 * "Referenced by" lists: drop scene references outside the scoped volume.
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

/** First act of the scoped volume: default act for scenes created while a volume is selected. */
export function defaultActForScope(app: App, projectFilePath: string | undefined | null): number | undefined {
    return getScopedVolume(app, projectFilePath)?.acts[0];
}

/**
 * Reorder helper for views that renumber a global counter from a scoped list
 * (Timeline chronological order): moves `moved` inside the FULL list to the
 * position it got in the scoped list (before `next`, else after `prev`).
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

/** Restrict a list of act numbers to the scoped volume. */
export function scopeActs(app: App, projectFilePath: string | undefined | null, acts: number[]): number[] {
    const vol = getScopedVolume(app, projectFilePath);
    return vol ? acts.filter(a => vol.acts.includes(a)) : acts;
}

/** Key fragment for view-level caches that must invalidate on scope change. */
export function volumeScopeKey(app: App, projectFilePath: string | undefined | null): string {
    return `vol:${getVolumeScope(app, projectFilePath)}`;
}

/**
 * Cache key for a view that caches the scenes of scopeFilter(filter) (Manuscript):
 * the scope id plus everything the scoped filter depends on, i.e. the
 * volume's resolved acts (numeric, without 0/99) and the merged act list
 * including the raw act strings ("05") of the project's scenes. Changing a
 * volume's `acts:` or a scene's act spelling invalidates the cache.
 */
export function volumeScopeFilterKey(app: App, projectFilePath: string | undefined | null, filter: SceneFilter | undefined): string {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return volumeScopeKey(app, projectFilePath);
    const scoped = scopeFilter(app, projectFilePath, filter);
    return `${volumeScopeKey(app, projectFilePath)}|acts:${JSON.stringify(vol.acts)}|scope:${JSON.stringify(scoped?.act ?? [])}`;
}

// ── Self-updating dropdowns ─────────────────────────
// Every rendered dropdown is registered here. syncVolumeScopeSelects updates
// options, value and visibility of all of them for the CURRENT project, so a
// view that does not rebuild its toolbar on refresh (Board, Plot Grid,
// Navigator) never shows a stale volume list or value.

interface ScopeSelect {
    select: HTMLSelectElement;
    /** Element hidden when the project has no volumes (select or "Filter by" wrapper). */
    host: HTMLElement;
    created: number;
    /** Was in the document at least once; removed from it afterwards means the view re-rendered or closed. */
    wasConnected: boolean;
}

const registry = new Set<ScopeSelect>();
/** A dropdown that never reached the document within this time is dropped. */
const ATTACH_GRACE_MS = 10000;

/** Drop dropdowns that left the document (or never reached it). Marks attached ones. */
function pruneRegistry(now = Date.now()): void {
    for (const entry of [...registry]) {
        if (entry.select.isConnected) entry.wasConnected = true;
        else if (entry.wasConnected || now - entry.created > ATTACH_GRACE_MS) registry.delete(entry);
    }
}

/** Number of registered dropdowns (simulation / debugging). */
export function volumeScopeSelectCount(): number {
    return registry.size;
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

/** Update every rendered volume dropdown to the current project's volumes and scope. */
export function syncVolumeScopeSelects(plugin: SceneCardsPlugin): void {
    const projectFilePath = plugin.sceneManager?.activeProject?.filePath;
    syncedProject = projectFilePath ?? null; // before getVolumeScope (which checks it)
    const volumes = getProjectVolumes(plugin.app, projectFilePath);
    let current = getVolumeScope(plugin.app, projectFilePath);
    // Stored id of a volume that no longer exists: back to "All volumes", so a
    // later volume that happens to get the same id is not selected silently.
    if (current && volumes.length > 0 && !volumes.some(v => v.id === current)) {
        clearVolumeScope(plugin.app, projectFilePath);
        current = '';
    }
    pruneRegistry();
    for (const entry of registry) syncOne(entry, volumes, current);
}

/**
 * Cheap check on every scope read: if the active project changed since the
 * last sync (by any code path, e.g. opening an entity of another book), sync
 * the dropdowns to the new project.
 */
function ensureDropdownsFollowProject(): void {
    if (!boundPlugin) return;
    const project = boundPlugin.sceneManager?.activeProject?.filePath ?? null;
    if (project !== syncedProject) syncVolumeScopeSelects(boundPlugin);
}

/**
 * Keep the dropdowns current when the project file's `volumes:` change
 * (added, renamed, deleted), also on startup when the metadata cache becomes
 * ready after a view was opened, and when the active project changes. Call once in onload.
 */
export function registerVolumeScopeSync(plugin: SceneCardsPlugin): void {
    boundPlugin = plugin;
    plugin.registerEvent(plugin.app.metadataCache.on('changed', (file) => {
        if (file.path === plugin.sceneManager?.activeProject?.filePath) syncVolumeScopeSelects(plugin);
    }));
    plugin.registerEvent(plugin.app.metadataCache.on('resolved', () => syncVolumeScopeSelects(plugin)));
    plugin.registerEvent(plugin.app.workspace.on('active-leaf-change', () => ensureDropdownsFollowProject()));
    plugin.registerEvent(plugin.app.workspace.on('layout-change', () => ensureDropdownsFollowProject()));
    plugin.register(() => { boundPlugin = null; registry.clear(); });
}

function createScopeSelect(parent: HTMLElement, plugin: SceneCardsPlugin, host?: HTMLElement): HTMLSelectElement {
    pruneRegistry(); // dropdowns of the previous render of this view are gone now
    const select = parent.createEl('select', {
        cls: 'dropdown sl-km-volume-scope',
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
 * Toolbar dropdown "All volumes / Volume 1 / …". Always rendered, but hidden
 * while the project defines no volumes; it shows up by itself as soon as
 * volumes exist. Changing it re-renders every open StoryLine view.
 */
export function renderVolumeScopeSelect(parent: HTMLElement, plugin: SceneCardsPlugin): void {
    createScopeSelect(parent, plugin);
}

/**
 * Filter-bar version: "Filter by [Volume ▾]" at the very left of the filter
 * bar (Board, Manuscript, Plot Grid). Hidden while no volumes exist.
 */
export function renderVolumeFilterBarStart(bar: HTMLElement, plugin: SceneCardsPlugin): void {
    const wrap = bar.createDiv('sl-km-filter-by');
    wrap.createSpan({ cls: 'sl-km-filter-by-label', text: 'Filter by' });
    createScopeSelect(wrap, plugin, wrap);
    bar.prepend(wrap);
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
