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
import { getScopedVolume } from '../utils/volumeScope';

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
    /** Number of other volumes holding affected scenes */
    otherVolumes: number;
    /** Affected scenes whose act belongs to no volume, outside the selection */
    outsideVolumes: number;
    /** Number of volumes holding affected scenes (all, regardless of selection) */
    volumesHit: number;
    /** Affected scenes without an act */
    unassigned: number;
    selectionTitle?: string;
    groups: TagImpactGroup[];
}

const hasAct = (s: Scene) => s.act !== undefined && s.act !== null && String(s.act).trim() !== '';

const bySequence = (a: Scene, b: Scene) =>
    (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0);

/**
 * Who loses the tag: every scene of the project that carries it (the same set
 * SceneManager.deleteTag changes), grouped by volume. Scenes without an act
 * and corkboard notes count as part of every volume selection, like
 * inVolumeScope(…, keepUnassigned = true) and scopeFilter.
 */
export function computeTagImpact(volumes: VolumeDef[], scoped: VolumeDef | undefined, allScenes: Scene[], tag: string): TagImpact {
    const affected = allScenes.filter(s => s.tags?.includes(tag)).sort(bySequence);
    const groups: TagImpactGroup[] = volumes.map(v => ({ id: v.id, kind: 'volume', title: v.title, scenes: [], isSelection: scoped?.id === v.id }));
    const unassigned: TagImpactGroup = { id: '#unassigned', kind: 'unassigned', title: 'No act', scenes: [], isSelection: !!scoped };
    const outside: TagImpactGroup = { id: '#outside', kind: 'outside', title: 'Not in a volume', scenes: [], isSelection: false };
    for (const s of affected) {
        if (!hasAct(s) || s.corkboardNote) { unassigned.scenes.push(s); continue; }
        const v = getVolumeForAct(volumes, s.act);
        const g = v ? groups.find(x => x.id === v.id) : undefined;
        (g ?? outside).scenes.push(s);
    }
    const all = [...groups, unassigned, outside];
    const used = all.filter(g => g.scenes.length > 0 || (g.kind === 'volume' && g.isSelection));
    const inSelection = scoped ? all.filter(g => g.isSelection).reduce((n, g) => n + g.scenes.length, 0) : affected.length;
    return {
        total: affected.length,
        inSelection,
        inSelectionUnassigned: scoped ? unassigned.scenes.length : 0,
        elsewhere: affected.length - inSelection,
        otherVolumes: scoped ? groups.filter(g => !g.isSelection && g.scenes.length > 0).length : 0,
        outsideVolumes: outside.scenes.length,
        volumesHit: groups.filter(g => g.scenes.length > 0).length,
        unassigned: unassigned.scenes.length,
        selectionTitle: scoped?.title,
        groups: volumes.length ? used : [],
    };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 other volumes and 1 scene outside any volume" */
function joinParts(parts: string[]): string {
    return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function sceneLabel(s: Scene): string {
    const act = hasAct(s) ? `${String(s.act)}-` : '';
    return `${act}${s.sequence ?? ''} ${s.title || s.filePath}`.trim();
}

/** Replaces the single-sentence text of the upstream "Delete plotline" dialog. */
export function renderTagDeleteImpact(parent: HTMLElement, app: App, projectFilePath: string | undefined | null, allScenes: Scene[], tag: string): void {
    const volumes = getProjectVolumes(app, projectFilePath);
    const scoped = getScopedVolume(app, projectFilePath);
    const impact = computeTagImpact(volumes, scoped, allScenes, tag);

    if (scoped) {
        const noAct = impact.inSelectionUnassigned
            ? `, ${impact.inSelectionUnassigned} of them without an act`
            : '';
        parent.createEl('p', {
            text: `The plotline "${tag}" has ${plural(impact.inSelection, 'scene', 'scenes')} in the current selection (${impact.selectionTitle}${noAct}).`,
        });
        if (impact.elsewhere > 0) {
            const where: string[] = [];
            if (impact.otherVolumes) where.push(plural(impact.otherVolumes, 'other volume', 'other volumes'));
            if (impact.outsideVolumes) where.push('acts outside any volume');
            parent.createEl('p', {
                cls: 'mod-warning sl-km-delete-impact-warning',
                text: `Deleting it removes the tag not only here, but also from ${plural(impact.elsewhere, 'more scene', 'more scenes')} in ${joinParts(where)}.`,
            });
        }
    } else {
        let where = '';
        if (impact.groups.length) {
            const parts: string[] = [];
            if (impact.volumesHit) parts.push(plural(impact.volumesHit, 'volume', 'volumes'));
            if (impact.outsideVolumes) parts.push('acts outside any volume');
            if (impact.unassigned) parts.push(`${plural(impact.unassigned, 'scene', 'scenes')} without an act`);
            where = parts.length ? ` (in ${joinParts(parts)})` : '';
        }
        parent.createEl('p', {
            text: `Remove the tag "${tag}" from ${plural(impact.total, 'scene', 'scenes')}${where}?`,
        });
    }
    parent.createEl('p', { cls: 'setting-item-description', text: 'The scenes themselves will not be deleted.' });

    if (impact.groups.length === 0) return;
    const cols = parent.createDiv('sl-km-delete-impact');
    for (const g of impact.groups) {
        const col = cols.createDiv(`sl-km-delete-impact-col${g.isSelection ? ' is-selection' : ''}`);
        col.createDiv({ cls: 'sl-km-delete-impact-head', text: `${g.title} (${g.scenes.length})` });
        const list = col.createEl('ul');
        for (const s of g.scenes) list.createEl('li', { text: sceneLabel(s) });
        if (g.scenes.length === 0) list.createEl('li', { cls: 'sl-km-muted', text: 'None' });
    }
}
