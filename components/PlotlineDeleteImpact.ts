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

export interface TagImpactGroup {
    /** Volume id, or '' for scenes outside every volume */
    id: string;
    title: string;
    scenes: Scene[];
    isSelection: boolean;
}

export interface TagImpact {
    total: number;
    /** Scenes in the current selection (the selected volume, or all scenes) */
    inSelection: number;
    /** Scenes outside the current selection */
    elsewhere: number;
    /** Number of other volumes (plus "without volume") holding affected scenes */
    otherGroups: number;
    selectionTitle?: string;
    groups: TagImpactGroup[];
}

const bySequence = (a: Scene, b: Scene) =>
    (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0);

/** Who loses the tag: every scene of the project that carries it, grouped by volume. */
export function computeTagImpact(volumes: VolumeDef[], scoped: VolumeDef | undefined, allScenes: Scene[], tag: string): TagImpact {
    const affected = allScenes.filter(s => s.tags?.includes(tag)).sort(bySequence);
    const groups: TagImpactGroup[] = volumes.map(v => ({ id: v.id, title: v.title, scenes: [], isSelection: scoped?.id === v.id }));
    const outside: TagImpactGroup = { id: '', title: 'Without volume', scenes: [], isSelection: false };
    for (const s of affected) {
        const v = getVolumeForAct(volumes, s.act);
        const g = v ? groups.find(x => x.id === v.id) : undefined;
        (g ?? outside).scenes.push(s);
    }
    const used = [...groups, outside].filter(g => g.scenes.length > 0 || g.isSelection);
    const inSelection = scoped ? (groups.find(g => g.isSelection)?.scenes.length ?? 0) : affected.length;
    return {
        total: affected.length,
        inSelection,
        elsewhere: affected.length - inSelection,
        otherGroups: scoped ? used.filter(g => !g.isSelection && g.scenes.length > 0).length : 0,
        selectionTitle: scoped?.title,
        groups: volumes.length ? used : [],
    };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Replaces the single-sentence text of the upstream "Delete plotline" dialog. */
export function renderTagDeleteImpact(parent: HTMLElement, app: App, projectFilePath: string | undefined | null, allScenes: Scene[], tag: string): void {
    const volumes = getProjectVolumes(app, projectFilePath);
    const scoped = getScopedVolume(app, projectFilePath);
    const impact = computeTagImpact(volumes, scoped, allScenes, tag);

    if (scoped) {
        parent.createEl('p', {
            text: `The plotline "${tag}" has ${plural(impact.inSelection, 'scene', 'scenes')} in the current selection (${impact.selectionTitle}).`,
        });
        if (impact.elsewhere > 0) {
            parent.createEl('p', {
                cls: 'mod-warning sl-km-delete-impact-warning',
                text: `Deleting it removes the tag not only here, but also from ${plural(impact.elsewhere, 'more scene', 'more scenes')} in ${plural(impact.otherGroups, 'other volume', 'other volumes')}.`,
            });
        }
    } else {
        parent.createEl('p', {
            text: `Remove the tag "${tag}" from ${plural(impact.total, 'scene', 'scenes')}${impact.groups.length ? ` in ${plural(impact.groups.filter(g => g.scenes.length).length, 'volume', 'volumes')}` : ''}?`,
        });
    }
    parent.createEl('p', { cls: 'setting-item-description', text: 'The scenes themselves will not be deleted.' });

    if (impact.groups.length === 0) return;
    const cols = parent.createDiv('sl-km-delete-impact');
    for (const g of impact.groups) {
        const col = cols.createDiv(`sl-km-delete-impact-col${g.isSelection ? ' is-selection' : ''}`);
        col.createDiv({ cls: 'sl-km-delete-impact-head', text: `${g.title} (${g.scenes.length})` });
        const list = col.createEl('ul');
        for (const s of g.scenes) {
            const act = s.act !== undefined ? `${String(s.act)}-` : '';
            list.createEl('li', { text: `${act}${s.sequence ?? ''} ${s.title || s.filePath}`.trim() });
        }
        if (g.scenes.length === 0) list.createEl('li', { cls: 'sl-km-muted', text: 'none' });
    }
}
