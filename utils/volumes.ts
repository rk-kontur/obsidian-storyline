// ═══════════════════════════════════════════════════════
//  Volumes as act groups (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// A volume is NOT a new level above acts. It is a named group of acts,
// defined optionally in the project file's frontmatter:
//
//   volumes:
//     - id: b1
//       title: "Band 1"
//       acts: [1, 2, 3, 4]        # or "1-4"
//       wordGoal: 90000           # optional
//       deadline: 2027-03-01      # optional
//
// Scenes, numbering, sorting and filenames are untouched; a scene's
// volume is derived from its act. Without `volumes:` every helper here
// returns "no volumes" and the plugin behaves exactly like upstream.

import type { App } from 'obsidian';
import { TFile } from 'obsidian';

export interface VolumeDef {
    id: string;
    title: string;
    acts: number[];
    wordGoal?: number;
    deadline?: string;
}

/** Parse `[1,2,3]`, `"1-4"`, `"1-4, 6"` or a single number into act numbers. */
export function parseActList(raw: unknown): number[] {
    const out: number[] = [];
    const addToken = (token: string) => {
        const t = token.trim();
        if (!t) return;
        const range = t.match(/^(\d+)\s*-\s*(\d+)$/);
        if (range) {
            const a = Number(range[1]);
            const b = Number(range[2]);
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
            return;
        }
        const n = Number(t);
        if (Number.isFinite(n)) out.push(n);
    };
    if (Array.isArray(raw)) {
        for (const item of raw) addToken(String(item));
    } else if (typeof raw === 'number') {
        out.push(raw);
    } else if (typeof raw === 'string') {
        raw.split(',').forEach(addToken);
    }
    return Array.from(new Set(out)).sort((a, b) => a - b);
}

/** Parse the raw `volumes:` frontmatter value. Invalid entries are skipped. */
export function parseVolumes(raw: unknown): VolumeDef[] {
    if (!Array.isArray(raw)) return [];
    const volumes: VolumeDef[] = [];
    raw.forEach((entry, idx) => {
        if (!entry || typeof entry !== 'object') return;
        const e = entry as Record<string, unknown>;
        const acts = parseActList(e.acts);
        if (acts.length === 0) return;
        const title = typeof e.title === 'string' && e.title.trim() ? e.title.trim() : `Volume ${idx + 1}`;
        const id = e.id !== undefined && String(e.id).trim() ? String(e.id).trim() : `v${idx + 1}`;
        const goal = Number(e.wordGoal);
        const deadline = e.deadline instanceof Date
            ? e.deadline.toISOString().slice(0, 10)
            : (e.deadline !== undefined && e.deadline !== null ? String(e.deadline) : undefined);
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

/** Volume containing the given act, or undefined. */
export function getVolumeForAct(volumes: VolumeDef[], act: number | string | undefined): VolumeDef | undefined {
    if (act === undefined || act === null || volumes.length === 0) return undefined;
    const n = Number(act);
    if (!Number.isFinite(n)) return undefined;
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

    /** Render an HTML volume band before the act divider if a new volume starts. */
    renderBefore(parent: HTMLElement, act: number | string | undefined, gridColumn?: string): void {
        const vol = this.next(act);
        if (!vol) return;
        const band = parent.createDiv('sl-km-volume-divider');
        if (gridColumn) band.setCssStyles({ gridColumn });
        band.createSpan({ cls: 'sl-km-volume-divider-label', text: vol.title });
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
