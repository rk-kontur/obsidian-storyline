// ═══════════════════════════════════════════════════════
//  Volumes editor (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Edits the optional `volumes:` block of the project file. Used as the
// "Volumes" tab of the "Manage story structure" dialog.

import { Notice, TFile } from 'obsidian';
import type { App } from 'obsidian';
import { assignMissingVolumeIds, getProjectVolumes, hasImplicitVolumeIds, readVolumeIdSeq, resolveVolumeIds, volumeIdNumber, type VolumeDef } from '../utils/volumes';
import { clearVolumeScopeIfId, getVolumeScope, nextVolumeId } from '../utils/volumeScope';

interface EditableVolume {
    id: string;
    title: string;
    acts: number[];
    wordGoal?: number;
    deadline?: string;
}

function rangeText(acts: number[]): string {
    if (acts.length === 0) return '';
    const contiguous = acts.every((a, i) => i === 0 || a === acts[i - 1] + 1);
    return contiguous ? `${acts[0]}–${acts[acts.length - 1]}` : acts.join(', ');
}

function toRange(from: number, to: number): number[] {
    const a = Math.min(from, to);
    const b = Math.max(from, to);
    const out: number[] = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
}

/** Volume rows that share acts with an earlier volume: index → overlapping acts. */
export function findOverlaps(volumes: { acts: number[] }[]): Map<number, number[]> {
    const seen = new Map<number, number>();
    const result = new Map<number, number[]>();
    volumes.forEach((v, i) => {
        for (const a of v.acts) {
            if (seen.has(a)) {
                if (!result.has(i)) result.set(i, []);
                result.get(i)!.push(a);
            } else {
                seen.set(a, i);
            }
        }
    });
    return result;
}

type VolumeFields = Pick<EditableVolume, 'title' | 'acts' | 'wordGoal' | 'deadline'>;

function sameActs(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** All ids in a raw `volumes:` array: explicit ones and the ones parseVolumes assigns. */
function rawVolumeIds(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const resolved = resolveVolumeIds(raw);
    return raw.map((e, i) => {
        const id: unknown = e && typeof e === 'object' ? (e as Record<string, unknown>).id : undefined;
        return typeof id === 'string' || typeof id === 'number' ? String(id).trim() : resolved[i];
    }).filter(id => id);
}

/**
 * Write the editor's changes back into the raw `volumes:` entries:
 * - Volumes the editor knows are updated in place. Only `id` and the fields
 *   that were changed in the editor (title, acts, word goal, deadline) are
 *   written; all other keys (e.g. `color`) and the original notation of
 *   unchanged fields (e.g. `acts: "1-4"`) stay as they are.
 * - Volumes deleted in the editor are removed; new ones are appended.
 * - Entries the editor cannot show (no valid acts, not an object) are kept.
 * - `volumeIdSeq` keeps the highest volume number ever used (also of deleted
 *   volumes), so ids are never handed out twice.
 */
async function saveVolumes(
    app: App,
    projectFilePath: string,
    volumes: EditableVolume[],
    original: Map<string, VolumeFields>,
    retiredIds: Iterable<string> = [],
): Promise<void> {
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) {
        new Notice('Project file not found.');
        return;
    }
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        const raw: unknown[] = Array.isArray(fm.volumes) ? (fm.volumes as unknown[]) : [];
        const seq = Math.max(readVolumeIdSeq(fm), ...volumes.map(v => volumeIdNumber(v.id)),
            ...[...retiredIds].map(volumeIdNumber), ...rawVolumeIds(raw).map(volumeIdNumber));
        if (seq > 0) fm.volumeIdSeq = seq;

        const byId = new Map(volumes.map(v => [v.id, v]));
        const resolved = resolveVolumeIds(raw);
        const written = new Set<string>();
        const out: unknown[] = [];
        raw.forEach((entry, idx) => {
            const id = resolved[idx];
            if (!id) { out.push(entry); return; } // draft / unknown entry: keep untouched
            const v = byId.get(id);
            if (!v || written.has(id)) return; // deleted in the editor
            written.add(id);
            const e = { ...(entry as Record<string, unknown>) };
            const before = original.get(id);
            e.id = id;
            if (!before || v.title !== before.title) e.title = v.title;
            if (!before || !sameActs(v.acts, before.acts)) e.acts = v.acts;
            if (!before || v.wordGoal !== before.wordGoal) {
                if (v.wordGoal) e.wordGoal = v.wordGoal; else delete e.wordGoal;
            }
            if (!before || v.deadline !== before.deadline) {
                if (v.deadline) e.deadline = v.deadline; else delete e.deadline;
            }
            out.push(e);
        });
        for (const v of volumes) {
            if (written.has(v.id)) continue;
            const e: Record<string, unknown> = { id: v.id, title: v.title, acts: v.acts };
            if (v.wordGoal) e.wordGoal = v.wordGoal;
            if (v.deadline) e.deadline = v.deadline;
            out.push(e);
        }
        if (out.length === 0) delete fm.volumes;
        else fm.volumes = out;
        // The file now holds these values: later saves compare against them
        original.clear();
        for (const v of volumes) original.set(v.id, { title: v.title, acts: [...v.acts], wordGoal: v.wordGoal, deadline: v.deadline });
    });
}

/**
 * Hand-written entries without `id`: add the id each one has now, in place,
 * so removing an entry above them no longer renames them. Nothing else changes.
 */
async function persistMissingIds(app: App, projectFilePath: string): Promise<void> {
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        assignMissingVolumeIds(fm.volumes);
    });
}

export function renderVolumesEditor(
    container: HTMLElement,
    app: App,
    projectFilePath: string | undefined,
    getDefinedActs: () => number[],
): void {
    container.empty();
    container.addClass('sl-km-volumes-editor');
    container.createEl('p', {
        cls: 'setting-item-description',
        text: 'A volume is a named group of acts. Scenes, numbering and file names stay as they are; a scene belongs to the volume of its act.',
    });
    if (!projectFilePath) {
        container.createEl('p', { cls: 'structure-empty', text: 'No active project.' });
        return;
    }

    const volumes: EditableVolume[] = getProjectVolumes(app, projectFilePath)
        .map((v: VolumeDef) => ({ ...v, acts: [...v.acts] }));
    // Field values at open: only fields changed in the editor are written back
    const original = new Map<string, VolumeFields>(volumes.map(v => [v.id, { title: v.title, acts: [...v.acts], wordGoal: v.wordGoal, deadline: v.deadline }]));

    // Ids deleted in this session are never handed out again
    const retiredIds = new Set<string>();
    const projectFile = app.vault.getAbstractFileByPath(projectFilePath);
    const projectFm = () => (projectFile instanceof TFile ? app.metadataCache.getFileCache(projectFile)?.frontmatter : undefined);
    // Hand-written entries without `id`: store the ids they have now, so
    // removing an entry above them no longer renames them.
    if (hasImplicitVolumeIds(projectFm()?.volumes)) void persistMissingIds(app, projectFilePath);

    const list = container.createDiv('sl-km-volumes-list');
    const warn = container.createDiv('sl-km-volumes-warning');
    let saveTimer: number | null = null;
    const scheduleSave = () => {
        if (saveTimer) window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => { void saveVolumes(app, projectFilePath, volumes, original, retiredIds); }, 400);
    };

    const render = () => {
        list.empty();
        warn.empty();
        if (volumes.length === 0) {
            list.createEl('p', { cls: 'structure-empty', text: 'No volumes defined yet.' });
        } else {
            const head = list.createDiv('sl-km-volume-row sl-km-volume-head');
            ['Title', 'From act', 'To act', 'Word goal', 'Deadline', ''].forEach(t => head.createSpan({ text: t }));
        }
        const overlaps = findOverlaps(volumes);

        volumes.forEach((v, i) => {
            const row = list.createDiv('sl-km-volume-row');
            if (overlaps.has(i)) row.addClass('has-overlap');

            const title = row.createEl('input', { type: 'text', value: v.title });
            title.addEventListener('change', () => { v.title = title.value.trim() || `Volume ${i + 1}`; scheduleSave(); });

            const contiguous = v.acts.every((a, k) => k === 0 || a === v.acts[k - 1] + 1);
            const from = row.createEl('input', { type: 'number', value: String(v.acts[0] ?? '') });
            const to = row.createEl('input', { type: 'number', value: String(v.acts[v.acts.length - 1] ?? '') });
            if (!contiguous) {
                from.title = to.title = `Acts ${rangeText(v.acts)} (editing turns this into a range)`;
            }
            const onRange = () => {
                const f = parseInt(from.value, 10);
                const t = parseInt(to.value, 10);
                if (isNaN(f) || isNaN(t) || f < 0 || t < 0) return;
                v.acts = toRange(f, t);
                scheduleSave();
                render();
            };
            from.addEventListener('change', onRange);
            to.addEventListener('change', onRange);

            const goal = row.createEl('input', { type: 'number', value: v.wordGoal ? String(v.wordGoal) : '' });
            goal.placeholder = '–';
            goal.addEventListener('change', () => {
                const n = parseInt(goal.value, 10);
                v.wordGoal = !isNaN(n) && n > 0 ? n : undefined;
                scheduleSave();
            });

            const deadline = row.createEl('input', { type: 'date', value: v.deadline ?? '' });
            deadline.addEventListener('change', () => { v.deadline = deadline.value || undefined; scheduleSave(); });

            const del = row.createEl('button', { cls: 'clickable-icon structure-remove', text: '×', attr: { 'aria-label': `Remove ${v.title}` } });
            del.addEventListener('click', () => {
                volumes.splice(i, 1);
                retiredIds.add(v.id);
                // The volume selection must not point to a deleted volume
                clearVolumeScopeIfId(app, projectFilePath, v.id);
                scheduleSave();
                render();
            });

            row.querySelectorAll('input').forEach(inp => inp.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation()));
        });

        if (overlaps.size > 0) {
            const parts = [...overlaps.entries()].map(([i, acts]) => `${volumes[i].title}: act ${acts.join(', ')}`);
            warn.setText(`Acts assigned to more than one volume (the first volume wins): ${parts.join('; ')}`);
        }

        // Defined acts not covered by any volume
        const covered = new Set(volumes.flatMap(v => v.acts));
        const free = getDefinedActs().filter(a => !covered.has(a) && a !== 0 && a !== 99);
        if (volumes.length > 0 && free.length > 0) {
            warn.createDiv({ cls: 'sl-km-muted', text: `Acts without volume: ${free.join(', ')}` });
        }
    };

    const addRow = container.createDiv('structure-add-row sl-km-volumes-add');
    // eslint-disable-next-line obsidianmd/ui/sentence-case -- the leading "+" is intentional
    const addBtn = addRow.createEl('button', { cls: 'mod-cta', text: '+ Add volume' });
    addBtn.addEventListener('click', () => {
        const used = volumes.flatMap(v => v.acts);
        const lastSize = volumes.length ? volumes[volumes.length - 1].acts.length : 4;
        const start = used.length ? Math.max(...used) + 1 : (getDefinedActs().filter(a => a > 0 && a !== 99)[0] ?? 1);
        const id = nextVolumeId([...volumes.map(v => v.id), ...rawVolumeIds(projectFm()?.volumes)], retiredIds, getVolumeScope(app, projectFilePath), readVolumeIdSeq(projectFm()));
        volumes.push({ id, title: `Volume ${volumes.length + 1}`, acts: toRange(start, start + Math.max(1, lastSize) - 1) });
        scheduleSave();
        render();
    });

    render();
}
