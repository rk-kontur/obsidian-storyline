// Edits the optional `volumes:` block of the project file. Used as the
// "Volumes" section of the "Manage story structure" dialog
// (StructureModalSections).

import { Notice, TFile } from 'obsidian';
import type { App } from 'obsidian';
import { EPILOGUE_ACT } from '../utils/actChapter';
import { isValidActRange, isVolumeAct, MAX_VOLUME_ACT, MAX_VOLUME_RANGE, nextVolumeId, normalizeVolumeIds, parseVolumes, readVolumeIdSeq, resolveVolumeIds, volumeIdNumber, type VolumeIdFix } from '../utils/volumes';

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

/** Copy of plain frontmatter data (arrays and objects); other values (dates) are shared. */
function cloneRaw(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(cloneRaw);
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, cloneRaw(v)]));
    }
    return value;
}

/** `volumes:` is set but is no list (a map, a string, …): the editor must not touch it. */
function isForeignVolumesValue(value: unknown): boolean {
    return value !== undefined && value !== null && !Array.isArray(value);
}

const NOT_A_LIST = 'volumes: in the project file is not a list; edit it by hand.';

function sameActs(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Explicit `id` of a raw `volumes:` entry, '' without one. */
function explicitId(entry: unknown): string {
    const id: unknown = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).id : undefined;
    return typeof id === 'string' || typeof id === 'number' ? String(id).trim() : '';
}

/** All ids in a raw `volumes:` array: explicit ones and the ones parseVolumes assigns. */
function rawVolumeIds(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const resolved = resolveVolumeIds(raw);
    return raw.map((e, i) => explicitId(e) || resolved[i]).filter(id => id);
}

/** State of one open Volumes tab. */
interface EditorSession {
    /**
     * Field values of every volume this dialog knows to be in the file (at
     * open, or written by this dialog). Only fields changed against it are
     * written; an id in here that is missing from the file was deleted
     * elsewhere and is never re-added.
     */
    original: Map<string, VolumeFields>;
    /** Deleted in this dialog and not yet removed from the file: id → fields at deletion. */
    pendingDeletes: Map<string, VolumeFields | undefined>;
    /** All ids deleted in this dialog (never handed out again). */
    retiredIds: Set<string>;
    /**
     * The order was changed in this dialog (move up / move down) and is not
     * saved yet. Only then does a save reorder entries; otherwise the order
     * in the file (also one changed by hand meanwhile) is kept.
     */
    orderChanged: boolean;
}

function fieldsOf(v: VolumeFields): VolumeFields {
    return { title: v.title, acts: [...v.acts], wordGoal: v.wordGoal, deadline: v.deadline };
}

function sameFields(a: VolumeFields, b: VolumeFields): boolean {
    return a.title === b.title && sameActs(a.acts, b.acts) && a.wordGoal === b.wordGoal && a.deadline === b.deadline;
}

/**
 * Raw index to remove for each id deleted in this dialog: exactly one entry
 * per id, preferably the one whose fields still match what the dialog knew
 * (another entry with the same id added elsewhere stays).
 */
function pickDeletions(raw: unknown[], resolved: string[], pending: Map<string, VolumeFields | undefined>): Set<number> {
    const out = new Set<number>();
    for (const [id, fields] of pending) {
        // Only entries with this explicit id: an entry without `id` was added by hand (see saveVolumes)
        const candidates = resolved.map((r, i) => (r === id && explicitId(raw[i]) ? i : -1)).filter(i => i >= 0);
        // Never saved (added and deleted before the first save): nothing of ours is in the file
        if (candidates.length === 0 || !fields) continue;
        const match = fields
            ? candidates.find(i => { const p = parseVolumes([raw[i]])[0]; return p ? sameFields(p, fields) : false; })
            : undefined;
        out.add(match ?? candidates[0]);
    }
    return out;
}

/**
 * Write the editor's changes back into the raw `volumes:` entries:
 * - Volumes shown in the dialog are updated in place. Only `id` and the
 *   fields changed in the dialog (title, acts, word goal, deadline) are
 *   written; other keys (e.g. `color`) and the notation of unchanged fields
 *   (e.g. `acts: "1-4"`) stay as they are.
 * - A volume deleted in the dialog removes exactly one entry with its id
 *   (preferably the one that still matches), once.
 * - Only volumes added in the dialog are appended. A volume that was in the
 *   file but has been deleted there meanwhile is not re-added. A file entry
 *   with the id of a volume added in the dialog (added elsewhere meanwhile,
 *   or a hand-added entry without id that resolves to it) is foreign: it is
 *   kept untouched and the new volume is appended with a fresh id.
 * - If `volumes:` is not a list, nothing is written (Notice).
 * - Every other entry is kept untouched in its position: drafts, non-objects,
 *   entries added elsewhere meanwhile, a second entry with an id already written.
 * - `volumeIdSeq` keeps the highest volume number ever used (also of deleted
 *   volumes), so ids are never handed out twice.
 * - Order (only after move up / move down in this dialog): the entries
 *   written for the dialog's volumes (updated in place or appended) are
 *   permuted among the positions they occupy, into the dialog's order. Their
 *   contents are not changed by this. Every other entry (drafts, non-object
 *   entries, entries added elsewhere, a second entry with an id already
 *   written) keeps its exact position, so these keep their order among each
 *   other and their place in the list. Without a move the file's order is kept.
 */
async function saveVolumes(
    app: App,
    projectFilePath: string,
    volumes: EditableVolume[],
    session: EditorSession,
): Promise<void> {
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) {
        new Notice('Project file not found.');
        return;
    }
    const { original, pendingDeletes, retiredIds } = session;
    if (isForeignVolumesValue(app.metadataCache.getFileCache(file)?.frontmatter?.volumes)) {
        new Notice(NOT_A_LIST);
        return;
    }
    let notAList = false;
    /** Volumes of the dialog whose file entry lost its explicit id (only an id-less entry resolves to it). */
    const lostIds: string[] = [];
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        if (isForeignVolumesValue(fm.volumes)) { notAList = true; return; }
        const raw: unknown[] = Array.isArray(fm.volumes) ? (fm.volumes as unknown[]) : [];
        const rawIds = rawVolumeIds(raw);
        let seq = Math.max(readVolumeIdSeq(fm), ...volumes.map(v => volumeIdNumber(v.id)),
            ...[...retiredIds].map(volumeIdNumber), ...rawIds.map(volumeIdNumber));

        const byId = new Map(volumes.map(v => [v.id, v]));
        const resolved = resolveVolumeIds(raw);
        const remove = pickDeletions(raw, resolved, pendingDeletes);
        // An entry without `id` is never written for a dialog volume (see below). If that is the
        // only entry left for one of its volumes (id line removed, sync reverted the id fix, …),
        // its edits cannot be saved: tell the user instead of dropping them silently.
        const lostEntry = (id: string) => !raw.some(e => explicitId(e) === id)
            && resolved.some((r, i) => r === id && !explicitId(raw[i]));
        for (const v of volumes) {
            if (original.has(v.id) && lostEntry(v.id)) lostIds.push(v.title);
        }
        // Same for a delete (pickDeletions skips entries without explicit id)
        for (const [id, fields] of pendingDeletes) {
            if (fields && lostEntry(id)) lostIds.push(fields.title);
        }
        const written = new Set<string>();
        const out: unknown[] = [];
        /** Positions in `out` of the entries written for the dialog's volumes, with their ids. */
        const own: Array<{ pos: number; id: string }> = [];
        raw.forEach((entry, idx) => {
            if (remove.has(idx)) return; // deleted in this dialog (one entry per id)
            const id = resolved[idx];
            const v = id ? byId.get(id) : undefined;
            const before = id ? original.get(id) : undefined;
            // Draft, unknown entry, entry not shown in this dialog (e.g. added
            // elsewhere meanwhile), an entry with the id of a volume added in
            // this dialog (not ours: no `before`), an entry without explicit id
            // (the dialog's volumes all have one in the file since the id fix,
            // so it was added by hand and only resolves to that id by position)
            // or a second entry with an id already written: keep untouched
            if (!id || !v || !before || !explicitId(entry) || written.has(id)) { out.push(entry); return; }
            written.add(id);
            const e = { ...(entry as Record<string, unknown>) };
            e.id = id;
            if (v.title !== before.title) e.title = v.title;
            if (!sameActs(v.acts, before.acts)) e.acts = v.acts;
            if (v.wordGoal !== before.wordGoal) {
                if (v.wordGoal) e.wordGoal = v.wordGoal; else delete e.wordGoal;
            }
            if (v.deadline !== before.deadline) {
                if (v.deadline) e.deadline = v.deadline; else delete e.deadline;
            }
            own.push({ pos: out.length, id });
            out.push(e);
        });
        // Append only volumes added in this dialog. A volume the dialog knew
        // to be in the file but that is gone now was deleted elsewhere: not re-added.
        const taken = new Set(rawIds);
        for (const v of volumes) {
            if (written.has(v.id) || original.has(v.id)) continue;
            // Its id is in the file already (foreign entry, see above): fresh id
            if (taken.has(v.id)) {
                v.id = nextVolumeId([...volumes.map(x => x.id), ...rawIds], retiredIds, seq);
                seq = Math.max(seq, volumeIdNumber(v.id));
            }
            const e: Record<string, unknown> = { id: v.id, title: v.title, acts: v.acts };
            if (v.wordGoal) e.wordGoal = v.wordGoal;
            if (v.deadline) e.deadline = v.deadline;
            own.push({ pos: out.length, id: v.id });
            out.push(e);
            written.add(v.id);
        }
        if (seq > 0) fm.volumeIdSeq = seq;
        if (session.orderChanged) {
            const rank = new Map(volumes.map((v, i) => [v.id, i]));
            const entries = own.map(o => ({ id: o.id, entry: out[o.pos] }))
                .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
            own.forEach((o, i) => { out[o.pos] = entries[i].entry; });
            session.orderChanged = false;
        }
        if (out.length === 0) delete fm.volumes;
        else fm.volumes = out;
        // The file now holds these values: later saves compare against them
        for (const id of pendingDeletes.keys()) original.delete(id);
        pendingDeletes.clear();
        for (const v of volumes) if (written.has(v.id)) original.set(v.id, fieldsOf(v));
    });
    if (notAList) new Notice(NOT_A_LIST);
    for (const title of lostIds) new Notice(`Volume "${title}" changed in the file meanwhile; reopen the dialog.`);
}

/**
 * Write the id fix of normalizeVolumeIds (missing ids, renumbered
 * duplicates) to the project file, in place. Only `id` values change.
 */
async function persistIdFix(app: App, projectFilePath: string): Promise<void> {
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        normalizeVolumeIds(fm.volumes, readVolumeIdSeq(fm));
        // Renumbered duplicates must count as used ids too
        const seq = Math.max(readVolumeIdSeq(fm), ...rawVolumeIds(fm.volumes).map(volumeIdNumber));
        if (seq > 0) fm.volumeIdSeq = seq;
    });
}

/** Handle of a rendered Volumes tab. */
export interface VolumesEditorHandle {
    /** Write a pending (debounced) change now. Resolves when every save so far is done. */
    flush(): Promise<void>;
    /** Flush and forget the editor (dialog closed). */
    dispose(): Promise<void>;
}

/** Editors whose dialog is still open: flushed on plugin unload. */
const openEditors = new Set<VolumesEditorHandle>();

/** Flush every open Volumes tab (plugin unload). */
export function flushOpenVolumeEditors(): Promise<void> {
    return Promise.all([...openEditors].map(h => h.flush())).then(() => undefined);
}

const NOOP_HANDLE: VolumesEditorHandle = { flush: () => Promise.resolve(), dispose: () => Promise.resolve() };

export function renderVolumesEditor(
    container: HTMLElement,
    app: App,
    projectFilePath: string | undefined,
    getDefinedActs: () => number[],
): VolumesEditorHandle {
    container.empty();
    container.addClass('story-line-volumes-editor');
    container.createEl('p', {
        cls: 'setting-item-description',
        text: 'A volume is a named group of acts. Scenes, numbering and file names stay as they are; a scene belongs to the volume of its act.',
    });
    if (!projectFilePath) {
        container.createEl('p', { cls: 'structure-empty', text: 'No active project.' });
        return NOOP_HANDLE;
    }

    const projectFile = app.vault.getAbstractFileByPath(projectFilePath);
    const projectFm = () => (projectFile instanceof TFile ? app.metadataCache.getFileCache(projectFile)?.frontmatter : undefined);
    // Ids must be explicit and unique before editing: entries without `id`
    // keep the id they have now, later duplicates get a new id. Applied to a
    // copy first (the editor shows the fixed ids), then written to the file.
    const fmNow = projectFm();
    const rawCopy: unknown = Array.isArray(fmNow?.volumes) ? cloneRaw(fmNow?.volumes) : [];
    const idFix: VolumeIdFix = normalizeVolumeIds(rawCopy, readVolumeIdSeq(fmNow));

    const volumes: EditableVolume[] = parseVolumes(rawCopy)
        .map(v => ({ ...v, acts: [...v.acts] }));
    // Field values at open: only fields changed in the editor are written back
    const original = new Map<string, VolumeFields>(volumes.map(v => [v.id, fieldsOf(v)]));

    // Ids deleted in this dialog: removed from the file on save, never handed out again
    const retiredIds = new Set<string>();
    const session: EditorSession = { original, pendingDeletes: new Map(), retiredIds, orderChanged: false };
    if (idFix.renumbered.length > 0) {
        container.createEl('p', {
            cls: 'story-line-volumes-warning',
            text: `Duplicate volume ids were renumbered: ${idFix.renumbered.map(r => `${r.title || 'untitled'} (${r.from} → ${r.to})`).join(', ')}.`,
        });
    }

    if (isForeignVolumesValue(fmNow?.volumes)) {
        container.createEl('p', { cls: 'story-line-volumes-warning', text: `${NOT_A_LIST} Changes made here are not saved.` });
    }

    const list = container.createDiv('story-line-volumes-list');
    const rangeHint = container.createDiv('story-line-volumes-warning');
    const warn = container.createDiv('story-line-volumes-warning');
    // Saves run one after another (each reads the file afresh); a change is
    // written 400 ms after the last edit, or at once by flush().
    let saveTimer: number | null = null;
    // The id fix runs first in the same chain, so every write is serialized
    let saving: Promise<void> = idFix.changed
        ? persistIdFix(app, projectFilePath).catch(() => { new Notice('Could not save the volume ids.'); })
        : Promise.resolve();
    const runSave = (): Promise<void> => {
        saving = saving
            .then(() => saveVolumes(app, projectFilePath, volumes, session))
            .catch(() => { new Notice('Could not save the volumes.'); });
        return saving;
    };
    const scheduleSave = () => {
        if (saveTimer !== null) window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => { saveTimer = null; void runSave(); }, 400);
    };
    const flush = (): Promise<void> => {
        if (saveTimer === null) return saving;
        window.clearTimeout(saveTimer);
        saveTimer = null;
        return runSave();
    };
    const handle: VolumesEditorHandle = {
        flush,
        dispose: () => { openEditors.delete(handle); return flush(); },
    };
    openEditors.add(handle);
    // Leaving a field of this tab writes its change at once, before a click
    // elsewhere in the dialog (e.g. "Add act") starts its own save.
    container.addEventListener('focusout', () => { void flush(); });

    const render = () => {
        list.empty();
        rangeHint.setText(''); // a hint belongs to the last range edit only
        warn.empty();
        if (volumes.length === 0) {
            list.createEl('p', { cls: 'structure-empty', text: 'No volumes defined yet.' });
        } else {
            const head = list.createDiv('story-line-volume-row story-line-volume-head');
            ['Title', 'From act', 'To act', 'Word goal', 'Deadline', '', ''].forEach(t => head.createSpan({ text: t }));
        }
        const overlaps = findOverlaps(volumes);

        volumes.forEach((v, i) => {
            const row = list.createDiv('story-line-volume-row');
            if (overlaps.has(i)) row.addClass('has-overlap');

            const title = row.createEl('input', { type: 'text', value: v.title });
            title.addEventListener('change', () => { v.title = title.value.trim() || `Volume ${i + 1}`; scheduleSave(); });

            const contiguous = v.acts.every((a, k) => k === 0 || a === v.acts[k - 1] + 1);
            const actAttr = { min: '0', max: String(MAX_VOLUME_ACT) };
            const from = row.createEl('input', { type: 'number', value: String(v.acts[0] ?? ''), attr: actAttr });
            const to = row.createEl('input', { type: 'number', value: String(v.acts[v.acts.length - 1] ?? ''), attr: actAttr });
            if (!contiguous) {
                from.title = to.title = `Acts ${rangeText(v.acts)} (editing turns this into a range)`;
            }
            const onRange = () => {
                const f = parseInt(from.value, 10);
                const t = parseInt(to.value, 10);
                if (isNaN(f) || isNaN(t) || f < 0 || t < 0) return;
                // Rejected: the fields show the saved range again, the hint says why
                const reject = (why: string) => {
                    from.value = String(v.acts[0] ?? '');
                    to.value = String(v.acts[v.acts.length - 1] ?? '');
                    rangeHint.setText(`${v.title}: ${why} Not saved, the previous range is shown again.`);
                };
                // Same limits as parseActList: the file must never get a range it would ignore
                if (!isValidActRange(f, t)) {
                    reject(`acts go up to ${MAX_VOLUME_ACT}, and a volume spans at most ${MAX_VOLUME_RANGE} acts.`);
                    return;
                }
                const acts = toRange(f, t).filter(isVolumeAct);
                if (acts.length === 0) {
                    reject('Prologue (act 0) and Epilogue (act 99) are not part of volumes.');
                    return;
                }
                const leftOut = acts.length < toRange(f, t).length;
                v.acts = acts;
                scheduleSave();
                render();
                if (leftOut) rangeHint.setText(`${v.title}: Prologue (act 0) and Epilogue (act 99) are not part of volumes and were left out.`);
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

            const move = row.createSpan({ cls: 'story-line-volume-move' });
            const moveBy = (delta: number) => {
                const j = i + delta;
                if (j < 0 || j >= volumes.length) return;
                [volumes[i], volumes[j]] = [volumes[j], volumes[i]];
                session.orderChanged = true;
                scheduleSave();
                render();
            };
            const up = move.createEl('button', { cls: 'clickable-icon', text: '↑', attr: { 'aria-label': `Move ${v.title} up` } });
            const down = move.createEl('button', { cls: 'clickable-icon', text: '↓', attr: { 'aria-label': `Move ${v.title} down` } });
            up.disabled = i === 0;
            down.disabled = i === volumes.length - 1;
            up.addEventListener('click', () => moveBy(-1));
            down.addEventListener('click', () => moveBy(1));

            const del = row.createEl('button', { cls: 'clickable-icon structure-remove', text: '×', attr: { 'aria-label': `Remove ${v.title}` } });
            del.addEventListener('click', () => {
                volumes.splice(i, 1);
                retiredIds.add(v.id);
                session.pendingDeletes.set(v.id, original.get(v.id));
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
        const free = getDefinedActs().filter(a => !covered.has(a) && isVolumeAct(a));
        if (volumes.length > 0 && free.length > 0) {
            warn.createDiv({ cls: 'story-line-volumes-note', text: `Acts without volume: ${free.join(', ')}` });
        }
    };

    const addRow = container.createDiv('structure-add-row story-line-volumes-add');
    // eslint-disable-next-line obsidianmd/ui/sentence-case -- the leading "+" is intentional
    const addBtn = addRow.createEl('button', { cls: 'mod-cta', text: '+ Add volume' });
    addBtn.addEventListener('click', () => {
        const used = volumes.flatMap(v => v.acts);
        const lastSize = volumes.length ? volumes[volumes.length - 1].acts.length : 4;
        const start = used.length ? Math.max(...used) + 1 : (getDefinedActs().filter(a => a > 0 && a !== 99)[0] ?? 1);
        const id = nextVolumeId([...volumes.map(v => v.id), ...rawVolumeIds(projectFm()?.volumes)], retiredIds, readVolumeIdSeq(projectFm()));
        // Stay inside the act limits of parseActList, without Prologue (0) and Epilogue (99)
        const first = Math.min(Math.max(start, 1), MAX_VOLUME_ACT);
        let acts = toRange(first, Math.min(first + Math.max(1, lastSize) - 1, MAX_VOLUME_ACT)).filter(isVolumeAct);
        if (acts.length === 0) acts = [first === EPILOGUE_ACT ? EPILOGUE_ACT + 1 : 1];
        volumes.push({ id, title: `Volume ${volumes.length + 1}`, acts });
        scheduleSave();
        render();
    });

    render();
    return handle;
}
