// ═══════════════════════════════════════════════════════
//  "Delete plotline" impact overview (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Deleting a plotline removes its tag from EVERY scene of the project, not
// only from the scenes visible under the current volume selection. The
// confirmation dialog therefore states how many scenes are affected in the
// current selection and elsewhere, and lists them per volume side by side.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { getProjectVolumes, getVolumeForAct, type VolumeDef } from '../utils/volumes';
import { actInVolumeScope, getScopedVolume } from '../utils/volumeScope';

export type TagImpactKind = 'volume' | 'unassigned' | 'outside';

export interface TagImpactGroup {
    /** Volume id; '#unassigned' / '#outside' for the two extra groups */
    id: string;
    kind: TagImpactKind;
    title: string;
    scenes: Scene[];
    isSelection: boolean;
}

export interface TagImpact {
    total: number;
    /** Scenes in the current selection (the selected volume plus scenes without an act, or all scenes) */
    inSelection: number;
    /** Of those: scenes without an act (visible under every volume selection) */
    inSelectionUnassigned: number;
    /** Scenes outside the current selection */
    elsewhere: number;
    /** Affected scenes in other volumes than the selected one */
    inOtherVolumes: number;
    /** Number of other volumes holding affected scenes */
    otherVolumes: number;
    /** Affected scenes that belong to no volume and are hidden under a volume selection */
    outsideVolumes: number;
    /** Affected scenes and number of volumes holding them (regardless of selection) */
    inVolumes: number;
    volumesHit: number;
    /** Affected scenes without an act */
    unassigned: number;
    /** Affected scenes the Plotlines view never lists, but which lose the tag too */
    inactive: number;
    notes: number;
    /** Scenes in the selection that are neither inactive nor corkboard notes */
    visibleInSelection: number;
    selectionTitle?: string;
    groups: TagImpactGroup[];
}

/**
 * "No act" exactly as the volume scope sees it: scopeFilter keeps scenes
 * whose act is undefined or '' (SceneQueryService.matchesFilter). An empty
 * `act:` (null) or whitespace is NOT kept, so such scenes belong outside.
 */
const isUnassigned = (s: Scene) => s.act === undefined || String(s.act) === '';
const hasAct = (s: Scene) => s.act !== undefined && s.act !== null && String(s.act).trim() !== '';

/** The volume scope rule of scopeFilter (numeric acts, no act inside every volume). */
const inScope = (vol: VolumeDef, s: Scene) => actInVolumeScope(vol, s.act);

const bySequence = (a: Scene, b: Scene) =>
    (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0);

/**
 * Who loses the tag: every scene of the project that carries it (the same set
 * SceneManager.deleteTag changes), grouped by volume. Grouping follows the
 * volume scope (scopeFilter), so "current selection" means what the views
 * show for the selected volume.
 */
export function computeTagImpact(volumes: VolumeDef[], scoped: VolumeDef | undefined, allScenes: Scene[], tag: string): TagImpact {
    const affected = allScenes.filter(s => s.tags?.includes(tag)).sort(bySequence);
    // Grouped by index, not id: duplicate ids in hand-written YAML stay apart.
    // The selection is the first volume with the scoped id, like getScopedVolume.
    const selIdx = scoped ? volumes.findIndex(v => v.id === scoped.id) : -1;
    const groups: TagImpactGroup[] = volumes.map((v, idx) => ({ id: v.id, kind: 'volume', title: v.title, scenes: [], isSelection: idx === selIdx }));
    const unassigned: TagImpactGroup = { id: '#unassigned', kind: 'unassigned', title: 'No act', scenes: [], isSelection: !!scoped };
    const outside: TagImpactGroup = { id: '#outside', kind: 'outside', title: 'Not in a volume', scenes: [], isSelection: false };
    for (const s of affected) {
        if (isUnassigned(s)) { unassigned.scenes.push(s); continue; }
        // Selection membership uses exactly the scope rule of the views
        // (numeric: "01" and " 2" are acts 1 and 2, "Prologue" is in no volume).
        if (scoped && inScope(scoped, s)) { (groups[selIdx] ?? outside).scenes.push(s); continue; }
        // Otherwise getVolumeForAct only picks the column (never the selection)
        const v = hasAct(s) ? getVolumeForAct(volumes, s.act) : undefined;
        const g = v ? groups[volumes.indexOf(v)] : undefined;
        (g && !g.isSelection ? g : outside).scenes.push(s);
    }
    const all = [...groups, unassigned, outside];
    const used = all.filter(g => g.scenes.length > 0 || (g.kind === 'volume' && g.isSelection));
    const inSelection = scoped ? all.filter(g => g.isSelection).reduce((n, g) => n + g.scenes.length, 0) : affected.length;
    const others = groups.filter(g => !g.isSelection && g.scenes.length > 0);
    const hit = groups.filter(g => g.scenes.length > 0);
    return {
        total: affected.length,
        inSelection,
        inSelectionUnassigned: scoped ? unassigned.scenes.length : 0,
        elsewhere: affected.length - inSelection,
        inOtherVolumes: scoped ? others.reduce((n, g) => n + g.scenes.length, 0) : 0,
        otherVolumes: scoped ? others.length : 0,
        outsideVolumes: outside.scenes.length,
        inVolumes: hit.reduce((n, g) => n + g.scenes.length, 0),
        volumesHit: hit.length,
        unassigned: unassigned.scenes.length,
        inactive: affected.filter(s => s.inactive && !s.corkboardNote).length,
        notes: affected.filter(s => s.corkboardNote).length,
        visibleInSelection: (scoped ? all.filter(g => g.isSelection).flatMap(g => g.scenes) : affected)
            .filter(s => !s.inactive && !s.corkboardNote).length,
        selectionTitle: scoped?.title,
        groups: volumes.length ? used : [],
    };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Included: N inactive scenes, N corkboard notes …" (shared by delete and rename). */
function renderIncludedLine(parent: HTMLElement, i: TagImpact, effect: string, listedCount?: number): void {
    const hidden: string[] = [];
    if (i.inactive) hidden.push(plural(i.inactive, 'inactive scene', 'inactive scenes'));
    if (i.notes) hidden.push(plural(i.notes, 'corkboard note', 'corkboard notes'));
    const filtered = listedCount !== undefined ? i.visibleInSelection - listedCount : 0;
    if (filtered > 0) hidden.push(`${plural(filtered, 'scene', 'scenes')} hidden by the scene / Arc Point filter`);
    if (!hidden.length) return;
    parent.createEl('p', {
        cls: 'setting-item-description',
        text: `Included: ${hidden.join(', ')}. This view does not list them, but ${effect}.`,
    });
}

function sceneLabel(s: Scene): string {
    const act = hasAct(s) ? `${String(s.act)}-` : '';
    const mark = s.corkboardNote ? ' (note)' : s.inactive ? ' (inactive)' : '';
    return `${act}${s.sequence ?? ''} ${s.title || s.filePath}`.trim() + mark;
}

/** Replaces the single-sentence text of the upstream "Delete plotline" dialog. */
export function renderTagDeleteImpact(
    parent: HTMLElement,
    app: App,
    projectFilePath: string | undefined | null,
    allScenes: Scene[],
    tag: string,
    /** Scenes the calling view lists for this plotline (after its own filters) */
    listedCount?: number,
): void {
    const volumes = getProjectVolumes(app, projectFilePath);
    const scoped = getScopedVolume(app, projectFilePath);
    const i = computeTagImpact(volumes, scoped, allScenes, tag);

    if (scoped) {
        const u = i.inSelectionUnassigned;
        const noAct = !u ? '' : u === i.inSelection ? (u === 1 ? ', without an act' : ', all without an act') : `, including ${u} without an act`;
        parent.createEl('p', {
            text: i.inSelection
                ? `The plotline "${tag}" has ${plural(i.inSelection, 'scene', 'scenes')} in the current selection (${i.selectionTitle}${noAct}).`
                : `The plotline "${tag}" has no scenes in the current selection (${i.selectionTitle}).`,
        });
        if (i.elsewhere > 0) {
            const where: string[] = [];
            if (i.inOtherVolumes) where.push(`${i.inOtherVolumes} in ${plural(i.otherVolumes, 'other volume', 'other volumes')}`);
            if (i.outsideVolumes) where.push(`${i.outsideVolumes} outside any volume`);
            parent.createEl('p', {
                cls: 'mod-warning sl-km-delete-impact-warning',
                text: i.inSelection
                    ? `Deleting it removes the tag not only here, but also from ${plural(i.elsewhere, 'more scene', 'more scenes')}: ${where.join(', ')}.`
                    : `Deleting it removes the tag from ${plural(i.elsewhere, 'scene', 'scenes')} elsewhere: ${where.join(', ')}.`,
            });
        }
    } else {
        parent.createEl('p', { text: `Remove the tag "${tag}" from ${plural(i.total, 'scene', 'scenes')}?` });
        const parts: string[] = [];
        if (i.groups.length) {
            if (i.inVolumes) parts.push(`${i.inVolumes} in ${plural(i.volumesHit, 'volume', 'volumes')}`);
            if (i.unassigned) parts.push(`${i.unassigned} without an act`);
            if (i.outsideVolumes) parts.push(`${i.outsideVolumes} outside any volume`);
        }
        if (parts.length > 1) parent.createEl('p', { text: `Affected: ${parts.join(', ')}.` });
    }

    renderIncludedLine(parent, i, 'they lose the tag too', listedCount);
    parent.createEl('p', { cls: 'setting-item-description', text: 'The scenes themselves will not be deleted.' });

    if (i.groups.length === 0) return;
    const cols = parent.createDiv('sl-km-delete-impact');
    for (const g of i.groups) {
        const col = cols.createDiv(`sl-km-delete-impact-col${g.isSelection ? ' is-selection' : ''}`);
        col.createDiv({ cls: 'sl-km-delete-impact-head', text: `${g.title} (${g.scenes.length})` });
        const list = col.createEl('ul');
        for (const s of g.scenes) list.createEl('li', { text: sceneLabel(s) });
        if (g.scenes.length === 0) list.createEl('li', { cls: 'sl-km-muted', text: 'None' });
    }
}

/**
 * Impact text for the upstream "Rename plotline" dialog: renaming changes the
 * tag in every scene of the project too, so with a volume selected it says
 * how many scenes in the selection and how many more elsewhere get the new name.
 */
export function renderTagRenameImpact(
    parent: HTMLElement,
    app: App,
    projectFilePath: string | undefined | null,
    allScenes: Scene[],
    tag: string,
): void {
    const volumes = getProjectVolumes(app, projectFilePath);
    const scoped = getScopedVolume(app, projectFilePath);
    const i = computeTagImpact(volumes, scoped, allScenes, tag);
    if (!scoped) {
        parent.createEl('p', {
            cls: 'setting-item-description',
            text: `${plural(i.total, 'scene gets', 'scenes get')} the new name.`,
        });
        renderIncludedLine(parent, i, 'they get the new name too');
        return;
    }
    parent.createEl('p', {
        cls: 'setting-item-description',
        text: `${plural(i.inSelection, 'scene', 'scenes')} in the current selection (${i.selectionTitle}) ${i.inSelection === 1 ? 'gets' : 'get'} the new name.`,
    });
    if (i.elsewhere > 0) {
        const where: string[] = [];
        if (i.inOtherVolumes) where.push(`${i.inOtherVolumes} in ${plural(i.otherVolumes, 'other volume', 'other volumes')}`);
        if (i.outsideVolumes) where.push(`${i.outsideVolumes} outside any volume`);
        parent.createEl('p', {
            cls: 'mod-warning sl-km-delete-impact-warning',
            text: `${plural(i.elsewhere, 'more scene', 'more scenes')} ${i.elsewhere === 1 ? 'is' : 'are'} renamed as well: ${where.join(', ')}.`,
        });
    }
    renderIncludedLine(parent, i, 'they get the new name too');
}
