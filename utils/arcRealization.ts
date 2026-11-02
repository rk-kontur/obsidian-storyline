/**
 * Arc Point "realized by": links an Arc Point to the scene that tells it.
 *
 * An Arc Point is a stage a plotline goes through, not necessarily a scene of
 * its own. The stage is often told in another scene (possibly on another
 * plotline). The optional frontmatter field on the Arc Point
 *
 *   realizedBy: "[[Funeral]]"
 *
 * links the two. The Subway map then draws the Arc Point's diamond on its own
 * lines at the station of the linked scene, joined by a dashed link.
 *
 * The field is read straight from the metadata cache, so the scene parser
 * and the Scene model stay untouched.
 */
import { TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';

export const REALIZED_BY_KEY = 'realizedBy';
/** Alternative spelling, accepted on read and removed on write. */
const REALIZED_BY_ALT_KEY = 'realized_by';

/** "[[Folder/Title#h|Alias]]" → "Folder/Title". A plain value is used as is ("Title#h" → "Title"). */
export function realizedByLinkpath(raw: string): string {
    const t = raw.trim();
    const m = t.match(/^\[\[(.*)\]\]$/);
    return (m ? m[1] : t).split('|')[0].split('#')[0].trim();
}

/** File name part of a link path without folder and ".md": "Folder/Title.md" → "Title". */
function linkpathName(linkpath: string): string {
    let name = linkpath.slice(Math.max(linkpath.lastIndexOf('/'), linkpath.lastIndexOf('\\')) + 1).trim();
    if (name.toLowerCase().endsWith('.md')) name = name.slice(0, -3).trim();
    return name;
}

/** Raw link text of `realizedBy` (also accepts `realized_by`), or undefined. */
export function readRealizedBy(app: App, scene: Scene): string | undefined {
    const file = app.vault.getAbstractFileByPath(scene.filePath);
    if (!(file instanceof TFile)) return undefined;
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    const raw: unknown = fm?.[REALIZED_BY_KEY] ?? fm?.[REALIZED_BY_ALT_KEY];
    if (Array.isArray(raw)) return raw.length ? String(raw[0]) : undefined;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/**
 * The realizing scene of an Arc Point among `candidates`, or undefined.
 * Resolves the link like Obsidian does; falls back to an equal scene title
 * or file name (e.g. a renamed file whose links were not updated).
 */
export function resolveRealizingScene(app: App, arc: Scene, candidates: Scene[]): Scene | undefined {
    const raw = readRealizedBy(app, arc);
    if (!raw) return undefined;
    const linkpath = realizedByLinkpath(raw);
    if (!linkpath) return undefined;
    const dest = app.metadataCache.getFirstLinkpathDest(linkpath, arc.filePath);
    if (dest) {
        const byPath = candidates.find(s => s.filePath === dest.path);
        if (byPath) return byPath;
    }
    const name = linkpathName(linkpath);
    return candidates.find(s => s !== arc && (s.title === name || linkpathName(s.filePath) === name));
}

/** Sets (`target`) or removes (undefined) the `realizedBy` link of an Arc Point. */
export async function writeRealizedBy(app: App, arc: Scene, target: Scene | undefined): Promise<void> {
    const file = app.vault.getAbstractFileByPath(arc.filePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        delete fm[REALIZED_BY_ALT_KEY];
        if (!target) { delete fm[REALIZED_BY_KEY]; return; }
        const targetFile = app.vault.getAbstractFileByPath(target.filePath);
        const linktext = targetFile instanceof TFile
            ? app.metadataCache.fileToLinktext(targetFile, arc.filePath, true)
            : (target.title || '');
        fm[REALIZED_BY_KEY] = `[[${linktext}]]`;
    });
}

/**
 * Removes `realizedBy` (both spellings) from a scene that is no longer an
 * Arc Point, so no orphaned link stays behind. Does nothing when neither
 * key is set.
 */
export async function clearRealizedBy(app: App, scene: Scene): Promise<void> {
    const file = app.vault.getAbstractFileByPath(scene.filePath);
    if (!(file instanceof TFile)) return;
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    if (fm && !(REALIZED_BY_KEY in fm) && !(REALIZED_BY_ALT_KEY in fm)) return;
    await app.fileManager.processFrontMatter(file, (front: Record<string, unknown>) => {
        delete front[REALIZED_BY_KEY];
        delete front[REALIZED_BY_ALT_KEY];
    });
}

export interface Realization {
    arc: Scene;
    target: Scene;
}

/**
 * Arc Points among `scenes` whose realizing scene is also in `scenes`
 * (and is not itself an Arc Point), keyed by the Arc Point's file path.
 */
export function resolveRealizations(app: App, scenes: Scene[]): Map<string, Realization> {
    const result = new Map<string, Realization>();
    const regular = scenes.filter(s => !s.arcAnchor);
    for (const s of scenes) {
        if (!s.arcAnchor) continue;
        const target = resolveRealizingScene(app, s, regular);
        if (target) result.set(s.filePath, { arc: s, target });
    }
    return result;
}

// ── Subway map helpers ──

/** Removes realized Arc Points from the station list (call before columns are assigned). */
export function removeRealizedStations(ordered: Scene[], realizations: Map<string, Realization>): void {
    if (realizations.size === 0) return;
    for (let i = ordered.length - 1; i >= 0; i--) {
        if (realizations.has(ordered[i].filePath)) ordered.splice(i, 1);
    }
}

/**
 * Gives every realized Arc Point the column of its realizing scene (call
 * after `colOf` is built). Returns a lookup "plotline|col" → Arc Point so
 * the node renderer draws the diamond instead of the scene node on the
 * Arc Point's own lanes.
 */
export function aliasRealizedColumns(
    colOf: Map<string, number>,
    realizations: Map<string, Realization>,
): Map<string, Scene> {
    const laneScene = new Map<string, Scene>();
    for (const [arcPath, { arc, target }] of realizations) {
        const col = colOf.get(target.filePath);
        if (col === undefined) continue;
        colOf.set(arcPath, col);
        // On a lane the scene also sits on, the scene's node wins
        for (const tag of arc.tags ?? []) {
            if (target.tags?.includes(tag)) continue;
            laneScene.set(`${tag}|${col}`, arc);
        }
    }
    return laneScene;
}

/**
 * Splits the lanes at a station into regular lanes (solid connector) and
 * lanes that only carry a realized Arc Point (dashed link).
 */
export function splitRealizedLanes(
    lanes: number[],
    col: number,
    plotlineKeys: string[],
    laneScene: Map<string, Scene>,
): { lanes: number[]; arcLanes: number[] } {
    if (laneScene.size === 0) return { lanes, arcLanes: [] };
    const regular: number[] = [];
    const arcLanes: number[] = [];
    for (const l of lanes) {
        (laneScene.has(`${plotlineKeys[l]}|${col}`) ? arcLanes : regular).push(l);
    }
    return { lanes: regular, arcLanes };
}

/** Dashed link from every realized Arc Point lane to the nearest regular lane. */
export function drawRealizedLinks(
    svg: SVGSVGElement,
    doc: Document,
    opts: { x: number; lanes: number[]; arcLanes: number[]; laneY: (lane: number) => number; color: (lane: number) => string },
): void {
    if (opts.arcLanes.length === 0 || opts.lanes.length === 0) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    for (const al of opts.arcLanes) {
        const y1 = opts.laneY(al);
        let nearest = opts.lanes[0];
        for (const l of opts.lanes) {
            if (Math.abs(opts.laneY(l) - y1) < Math.abs(opts.laneY(nearest) - y1)) nearest = l;
        }
        const y2 = opts.laneY(nearest);

        // Colour blend from the Arc Point's line to the scene's line, like the solid connectors
        const gradId = `realized-grad-${Math.round(opts.x)}-${al}`;
        const defs = svg.querySelector('defs') || (() => {
            const d = doc.createElementNS(svgNS, 'defs');
            svg.insertBefore(d, svg.firstChild);
            return d;
        })();
        const grad = doc.createElementNS(svgNS, 'linearGradient');
        grad.setAttribute('id', gradId);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        grad.setAttribute('x1', String(opts.x));
        grad.setAttribute('y1', String(y1));
        grad.setAttribute('x2', String(opts.x));
        grad.setAttribute('y2', String(y2));
        for (const [offset, color] of [['0%', opts.color(al)], ['100%', opts.color(nearest)]]) {
            const stop = doc.createElementNS(svgNS, 'stop');
            stop.setAttribute('offset', offset);
            stop.setAttribute('stop-color', color);
            grad.appendChild(stop);
        }
        defs.appendChild(grad);

        const line = doc.createElementNS(svgNS, 'line');
        line.setAttribute('x1', String(opts.x));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(opts.x));
        line.setAttribute('y2', String(y2));
        line.setAttribute('stroke', `url(#${gradId})`);
        line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-dasharray', '12,4');
        line.setAttribute('stroke-linecap', 'butt');
        line.setAttribute('opacity', '0.65');
        svg.appendChild(line);
    }
}
