// ═══════════════════════════════════════════════════════
//  Volumes as act groups (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// A volume is NOT a new level above acts. It is a named group of acts,
// defined optionally in the project file's frontmatter:
//
//   volumes:
//     - id: b1
//       title: "Volume 1"
//       acts: [1, 2, 3, 4]        # or "1-4"
//       wordGoal: 90000           # optional
//       deadline: 2027-03-01      # optional
//
// Scenes, numbering, sorting and filenames are untouched; a scene's
// volume is derived from its act. Without `volumes:` every helper here
// returns "no volumes" and the plugin behaves exactly like upstream.

import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import { EPILOGUE_ACT, PROLOGUE_ACT } from './actChapter';

export interface VolumeDef {
    id: string;
    title: string;
    acts: number[];
    wordGoal?: number;
    deadline?: string;
}

/** Highest act number a volume may name; larger values are ignored. */
export const MAX_VOLUME_ACT = 9999;
/** Most acts one range token ("1-1000") may expand to; wider ranges are ignored. */
export const MAX_VOLUME_RANGE = 1000;

/** True if `from`-`to` is a range parseActList accepts (bounds and width). */
export function isValidActRange(from: number, to: number): boolean {
    const a = Math.min(from, to);
    const b = Math.max(from, to);
    return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b <= MAX_VOLUME_ACT && b - a + 1 <= MAX_VOLUME_RANGE;
}

/**
 * Parse `[1,2,3]`, `"1-4"`, `"1–4, 6"` or a single number into act numbers.
 * Hyphen, en dash and em dash separate ranges. Tokens outside 0..MAX_VOLUME_ACT
 * and ranges wider than MAX_VOLUME_RANGE acts are ignored (a typo like
 * "1-40000" must not expand into thousands of acts).
 */
export function parseActList(raw: unknown): number[] {
    const out: number[] = [];
    const addNumber = (n: number) => {
        if (Number.isFinite(n) && n >= 0 && n <= MAX_VOLUME_ACT) out.push(n);
    };
    const addToken = (token: string) => {
        const t = token.trim();
        if (!t) return;
        const range = t.match(/^(\d+)\s*[-\u2013\u2014]\s*(\d+)$/);
        if (range) {
            const a = Number(range[1]);
            const b = Number(range[2]);
            if (!isValidActRange(a, b)) return;
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
            return;
        }
        addNumber(Number(t));
    };
    if (Array.isArray(raw)) {
        for (const item of raw) addToken(String(item));
    } else if (typeof raw === 'number') {
        addNumber(raw);
    } else if (typeof raw === 'string') {
        raw.split(',').forEach(addToken);
    }
    return Array.from(new Set(out)).sort((a, b) => a - b);
}

/**
 * Numeric value of a scene's act for volume membership: 5, "5", "05" and
 * " 5 " are all act 5. Anything that is not a plain decimal number
 * ("Prologue", "Act 5", "", null) is undefined and belongs to no volume,
 * and so are 0 (Prologue) and 99 (Epilogue), see isVolumeAct.
 * Every volume membership decision (badges, scope, statistics, export,
 * delete/rename impact) goes through this.
 */
export function actNumber(act: unknown): number | undefined {
    let n: number | undefined;
    if (typeof act === 'number') n = Number.isFinite(act) ? act : undefined;
    else if (typeof act === 'string' && /^\d+(?:\.\d+)?$/.test(act.trim())) n = Number(act.trim());
    return n !== undefined && isVolumeAct(n) ? n : undefined;
}

/**
 * Prologue (act 0, PROLOGUE_ACT) and Epilogue (act 99, EPILOGUE_ACT) belong
 * to no volume, also when a volume's `acts:` names them ("0-4"): they are
 * dropped from VolumeDef.acts and never match a scene.
 */
export function isVolumeAct(n: number): boolean {
    return n !== PROLOGUE_ACT && n !== EPILOGUE_ACT;
}

/** Acts of a raw `acts:` value that can belong to a volume (parseActList without Prologue/Epilogue). */
export function parseVolumeActs(raw: unknown): number[] {
    return parseActList(raw).filter(isVolumeAct);
}

/** Trimmed text of a string/number frontmatter value, '' for anything else. */
function scalarText(v: unknown): string {
    return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';
}

/**
 * Id of every raw `volumes:` entry as parseVolumes assigns it, '' for entries
 * parseVolumes skips (not an object, no valid acts). Entries without `id` get
 * "v<position>", but never an id that another entry uses explicitly (that
 * would make two volumes share one id).
 */
export function resolveVolumeIds(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const explicitIds = new Set(raw
        .map(e => (e && typeof e === 'object' ? scalarText((e as Record<string, unknown>).id) : ''))
        .filter(id => id));
    const usedIds = new Set<string>();
    return raw.map((entry, idx) => {
        if (!entry || typeof entry !== 'object') return '';
        const e = entry as Record<string, unknown>;
        if (parseVolumeActs(e.acts).length === 0) return '';
        let id = scalarText(e.id);
        if (!id) {
            let n = idx + 1;
            while (explicitIds.has(`v${n}`) || usedIds.has(`v${n}`)) n++;
            id = `v${n}`;
        }
        usedIds.add(id);
        return id;
    });
}

/** Result of normalizeVolumeIds: what was changed in place. */
export interface VolumeIdFix {
    changed: boolean;
    /** Later entries that shared an explicit id with an earlier one: title, old id, new id. */
    renumbered: Array<{ title: string; from: string; to: string }>;
}

/**
 * Make the ids of a raw `volumes:` array explicit and unique, in place:
 * - Entries without `id` get the id they have now (resolveVolumeIds); an
 *   entry parseVolumes skips (e.g. a draft without acts) gets a free
 *   "v<position>" id.
 * - Explicit duplicates: the first entry keeps the id, every later one gets
 *   a new id above every id in the list and above `seq` (volumeIdSeq).
 * Only `id` is touched. Non-object entries are left alone.
 */
export function normalizeVolumeIds(raw: unknown, seq = 0): VolumeIdFix {
    const fix: VolumeIdFix = { changed: false, renumbered: [] };
    if (!Array.isArray(raw)) return fix;
    const resolved = resolveVolumeIds(raw);
    const entries = raw.map(e => (e && typeof e === 'object' ? (e as Record<string, unknown>) : null));
    const allIds = entries.map((e, i) => (e ? scalarText(e.id) || resolved[i] : '')).filter(id => id);
    let next = Math.max(seq, ...allIds.map(volumeIdNumber)) + 1;
    const taken = new Set(allIds);
    const seen = new Set<string>();
    // 1. Explicit duplicates get a fresh id
    entries.forEach(e => {
        if (!e) return;
        const id = scalarText(e.id);
        if (!id) return;
        if (seen.has(id)) {
            const to = `v${next++}`;
            fix.renumbered.push({ title: typeof e.title === 'string' ? e.title : '', from: id, to });
            e.id = to;
            taken.add(to);
            fix.changed = true;
        }
        seen.add(scalarText(e.id));
    });
    // 2. Missing ids: the current positional id, drafts a free one
    entries.forEach((e, idx) => {
        if (!e || scalarText(e.id)) return;
        let id = resolved[idx];
        if (!id) {
            let n = idx + 1;
            while (taken.has(`v${n}`)) n++;
            id = `v${n}`;
            taken.add(id);
        }
        e.id = id;
        fix.changed = true;
    });
    return fix;
}

/** Parse the raw `volumes:` frontmatter value. Invalid entries are skipped. */
export function parseVolumes(raw: unknown): VolumeDef[] {
    if (!Array.isArray(raw)) return [];
    const volumes: VolumeDef[] = [];
    const ids = resolveVolumeIds(raw);
    // Hand-written YAML may repeat an explicit id. Every consumer keys by id
    // (Maps, scope selection), so a later duplicate gets "<id>~2", "~3", ...
    // here, in the output only (nothing is written). The volumes editor
    // renumbers such duplicates in the file when it opens.
    const taken = new Set(ids.filter(id => id));
    const seen = new Set<string>();
    raw.forEach((entry, idx) => {
        let id = ids[idx];
        if (!id) return;
        if (seen.has(id)) {
            let n = 2;
            while (taken.has(`${id}~${n}`)) n++;
            id = `${id}~${n}`;
            taken.add(id);
        }
        seen.add(id);
        const e = entry as Record<string, unknown>;
        const acts = parseVolumeActs(e.acts);
        const title = typeof e.title === 'string' && e.title.trim() ? e.title.trim() : `Volume ${idx + 1}`;
        const goal = Number(e.wordGoal);
        const deadline = e.deadline instanceof Date
            ? e.deadline.toISOString().slice(0, 10)
            : (scalarText(e.deadline) || undefined);
        volumes.push({
            id,
            title,
            acts,
            wordGoal: Number.isFinite(goal) && goal > 0 ? goal : undefined,
            deadline: deadline || undefined,
        });
    });
    return volumes;
}

/** Read volumes from the project file of the active project (via metadata cache). */
export function getProjectVolumes(app: App, projectFilePath: string | undefined | null): VolumeDef[] {
    if (!projectFilePath) return [];
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return [];
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    return parseVolumes(fm?.volumes);
}

/**
 * Highest volume number ever handed out in this project (`volumeIdSeq` in
 * the project file, written by the volumes editor). 0 if not set.
 */
export function readVolumeIdSeq(fm: Record<string, unknown> | undefined | null): number {
    const n = Number(fm?.volumeIdSeq);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Numeric part of a generated id ("v7" → 7), 0 for other ids. */
export function volumeIdNumber(id: string | undefined | null): number {
    const m = /^v(\d+)$/.exec(id ?? '');
    return m ? Number(m[1]) : 0;
}

/** Volume containing the given act, or undefined. */
export function getVolumeForAct(volumes: VolumeDef[], act: number | string | undefined): VolumeDef | undefined {
    if (act === undefined || act === null || volumes.length === 0) return undefined;
    const n = actNumber(act);
    if (n === undefined) return undefined;
    return volumes.find(v => v.acts.includes(n));
}

/** Act numbers of a volume by id (empty if unknown). */
export function getActsForVolume(volumes: VolumeDef[], id: string): number[] {
    return volumes.find(v => v.id === id)?.acts ?? [];
}

/** Export range (field 'act') for one volume, undefined for '' / unknown id. */
export function volumeExportRange(
    volumes: VolumeDef[],
    id: string,
): { field: 'act'; sequenceRanges: Array<{ start: number; end: number }> } | undefined {
    if (!id) return undefined;
    const acts = getActsForVolume(volumes, id);
    if (acts.length === 0) return undefined;
    return { field: 'act', sequenceRanges: acts.map(a => ({ start: a, end: a })) };
}

/**
 * Tracks the current volume while a view renders act dividers in order and
 * emits a volume band whenever a new volume starts.
 */
export class VolumeDividerTracker {
    private lastId: string | null = null;

    constructor(private volumes: VolumeDef[]) {}

    get active(): boolean {
        return this.volumes.length > 0;
    }

    /** Returns the volume if `act` starts a new volume, else undefined. */
    next(act: number | string | undefined): VolumeDef | undefined {
        if (!this.active) return undefined;
        const vol = getVolumeForAct(this.volumes, act);
        if (!vol || vol.id === this.lastId) return undefined;
        this.lastId = vol.id;
        return vol;
    }

    /** Render an HTML volume band before the act divider if a new volume starts; returns the band. */
    renderBefore(parent: HTMLElement, act: number | string | undefined, gridColumn?: string): HTMLElement | undefined {
        const vol = this.next(act);
        if (!vol) return undefined;
        return this.renderBand(parent, vol, gridColumn);
    }

    /**
     * Render the band of a given volume (e.g. a volume without scenes, which
     * has no act divider) unless it is the current one; returns the band.
     */
    renderVolume(parent: HTMLElement, vol: VolumeDef, gridColumn?: string): HTMLElement | undefined {
        if (!this.active || vol.id === this.lastId) return undefined;
        this.lastId = vol.id;
        return this.renderBand(parent, vol, gridColumn);
    }

    private renderBand(parent: HTMLElement, vol: VolumeDef, gridColumn?: string): HTMLElement {
        const band = parent.createDiv('sl-km-volume-divider');
        if (gridColumn) band.setCssStyles({ gridColumn });
        band.createSpan({ cls: 'sl-km-volume-divider-label', text: vol.title });
        return band;
    }
}

/** SVG volume marker for the Subway map: solid line plus title above the act labels. */
export function drawSubwayVolumeMarker(
    svg: SVGSVGElement,
    doc: Document,
    opts: { x: number; labelX: number; labelY: number; y1: number; y2: number; title: string; drawLine: boolean },
): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    if (opts.drawLine) {
        const line = doc.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(opts.x));
        line.setAttribute('y1', String(opts.y1));
        line.setAttribute('x2', String(opts.x));
        line.setAttribute('y2', String(opts.y2));
        line.setAttribute('stroke', 'var(--text-muted)');
        line.setAttribute('stroke-width', '4');
        svg.appendChild(line);
    }
    if (!opts.title) return; // no separate title (e.g. shown in the act labels instead)
    const label = doc.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(opts.labelX));
    label.setAttribute('y', String(opts.labelY));
    label.setAttribute('text-anchor', 'start');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', 'var(--text-accent)');
    label.textContent = opts.title.toUpperCase();
    svg.appendChild(label);
}

/**
 * Kanban helper: a narrow vertical band with the volume title, inserted
 * between act columns where a new volume starts.
 */
export function renderVolumeColumnDivider(parent: HTMLElement, vol: VolumeDef): void {
    const band = parent.createDiv('sl-km-volume-column');
    band.setAttribute('title', vol.title);
    band.createSpan({ cls: 'sl-km-volume-column-label', text: vol.title });
}

/** Act number from a Kanban act column key ("Act 5", "Prologue", "Epilogue"). */
export function actFromColumnKey(key: string): number | undefined {
    const k = key.trim().toLowerCase();
    if (k === 'prologue') return 0;
    if (k === 'epilogue') return 99;
    const m = k.match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : undefined;
}
