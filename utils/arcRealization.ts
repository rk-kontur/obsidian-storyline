// ═══════════════════════════════════════════════════════
//  Arc Point "realizedBy" (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// An Arc Point is a stage a character goes through, not a scene. The stage
// is often told in another scene (possibly another character's). The
// optional frontmatter field on the Arc Point
//
//   realizedBy: "[[Funeral]]"
//
// links the two. The Subway map then draws the Arc Point's diamond on its
// own lines AT THE STATION of the linked scene, so the existing interchange
// connector joins both lines. No second zone, no second layout pass.
//
// The field is read straight from the metadata cache, so the scene parser
// (MetadataParser whitelist) stays untouched.

import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import type { Scene } from '../models/Scene';

export const REALIZED_BY_KEY = 'realizedBy';

/** Raw link text of `realizedBy` (also accepts `realized_by`), or undefined. */
export function readRealizedBy(app: App, scene: Scene): string | undefined {
    const file = app.vault.getAbstractFileByPath(scene.filePath);
    if (!(file instanceof TFile)) return undefined;
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    const raw: unknown = fm?.[REALIZED_BY_KEY] ?? fm?.realized_by;
    if (Array.isArray(raw)) return raw.length ? String(raw[0]) : undefined;
    return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/** "[[Path/Title|Alias]]" → "Path/Title" */
export function linkpathOf(raw: string): string {
    let t = raw.trim();
    const m = t.match(/^\[\[(.*)\]\]$/);
    if (m) t = m[1];
    return t.split('|')[0].split('#')[0].trim();
}

/** Resolve the realizing scene of an Arc Point among `candidates`. */
export function resolveRealizingScene(app: App, arc: Scene, candidates: Scene[]): Scene | undefined {
    const raw = readRealizedBy(app, arc);
    if (!raw) return undefined;
    const linkpath = linkpathOf(raw);
    if (!linkpath) return undefined;
    const dest = app.metadataCache.getFirstLinkpathDest(linkpath, arc.filePath);
    if (dest) {
        const byPath = candidates.find(s => s.filePath === dest.path);
        if (byPath) return byPath;
    }
    const title = linkpath.split('/').pop()?.replace(/\.md$/i, '');
    return candidates.find(s => s !== arc && (s.title === title || s.filePath.split('/').pop()?.replace(/\.md$/i, '') === title));
}

export interface Realization {
    arc: Scene;
    target: Scene;
}

/**
 * Arc Points among `scenes` whose realizing scene is also in `scenes`
 * (and is not itself an Arc Point). Keyed by the Arc Point's file path.
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

/**
 * Subway helper. Call after the station order is final and before columns
 * are assigned: removes realized Arc Points from the station list.
 */
export function removeRealizedStations(ordered: Scene[], realizations: Map<string, Realization>): void {
    if (realizations.size === 0) return;
    for (let i = ordered.length - 1; i >= 0; i--) {
        if (realizations.has(ordered[i].filePath)) ordered.splice(i, 1);
    }
}

/**
 * Subway helper. Call after `colOf` is built: gives every realized Arc Point
 * the column of its realizing scene. Returns a lookup "lane|col" → Arc Point
 * so the node renderer can draw the diamond instead of the scene node on
 * the Arc Point's own lanes.
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
        for (const tag of arc.tags ?? []) laneScene.set(`${tag}|${col}`, arc);
    }
    return laneScene;
}
