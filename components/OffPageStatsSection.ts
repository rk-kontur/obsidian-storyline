// ═══════════════════════════════════════════════════════
//  Statistics for off page plotlines
// ═══════════════════════════════════════════════════════
//
// Off page plotlines (`offPageLines` in the project file) carry stages that
// happen in the background: character arcs, technology, politics, genre
// conventions. Their Arc Points are "told" once they are linked to the scene
// that tells them (`realizedBy`). This module reports, per off page line,
// how many stages already reach the text, and adjusts the Validator
// warnings: gaps between acts are normal for such lines and are not
// reported; stages that are not yet told are listed instead.
//
// Without `offPageLines` the coverage is empty and nothing changes.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import type { PlotWarning } from '../services/Validator';
import { compareScenesByActChapter } from '../utils/actChapter';
import { resolveRealizations } from '../utils/arcRealization';
import { normalizePlotlineTag } from '../utils/pageZones';

export interface OffPageLineCoverage {
    /** Display name: the scene tag as written, or the normalized entry if spelled several ways */
    line: string;
    /** Scene tags as written that match this entry (the names the Validator uses) */
    names: string[];
    /** Arc Points on this line */
    stages: Scene[];
    told: { arc: Scene; scene: Scene }[];
    open: Scene[];
    /** Regular scenes on this line (an off page line may also hold scenes) */
    scenes: number;
}

/** Coverage of every off page line that exists as a scene tag, sorted by name. */
export function computeOffPageCoverage(app: App, offPageLines: Set<string>, scenes: Scene[]): OffPageLineCoverage[] {
    if (offPageLines.size === 0) return [];
    // Entries are normalized; scene tags may be written by hand ("Main Mystery")
    const tagNames = new Map<string, Set<string>>();
    for (const tag of scenes.flatMap(s => s.tags ?? [])) {
        const key = normalizePlotlineTag(tag);
        if (!offPageLines.has(key)) continue;
        if (!tagNames.has(key)) tagNames.set(key, new Set());
        tagNames.get(key)!.add(tag);
    }
    // Entries without a matching tag (left over or hand-edited) are ignored
    if (tagNames.size === 0) return [];
    const realizations = resolveRealizations(app, scenes);
    return [...tagNames.keys()].sort((a, b) => a.localeCompare(b)).map(key => {
        const names = [...tagNames.get(key)!];
        const onLine = scenes.filter(s => s.tags?.some(t => normalizePlotlineTag(t) === key));
        const stages = onLine.filter(s => s.arcAnchor)
            .sort((a, b) => compareScenesByActChapter(a, b, (x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)));
        const told: { arc: Scene; scene: Scene }[] = [];
        const open: Scene[] = [];
        for (const arc of stages) {
            const realization = realizations.get(arc.filePath);
            if (realization) told.push({ arc, scene: realization.target }); else open.push(arc);
        }
        return { line: names.length === 1 ? names[0] : key, names, stages, told, open, scenes: onLine.length - stages.length };
    });
}

/** Text for the overview card, e.g. "12 / 30". */
export function offPageCardValue(coverage: OffPageLineCoverage[]): string {
    const total = coverage.reduce((n, c) => n + c.stages.length, 0);
    const told = coverage.reduce((n, c) => n + c.told.length, 0);
    return `${told} / ${total}`;
}

/** Stage titles listed in one off page warning before "and N more". */
const MAX_WARNING_TITLES = 5;

/**
 * Validator warnings adjusted for off page lines: act gap warnings for these
 * lines are dropped, stages not yet told are reported per line instead.
 */
export function adjustOffPageWarnings(warnings: PlotWarning[], coverage: OffPageLineCoverage[]): PlotWarning[] {
    if (coverage.length === 0) return warnings;
    const lines = new Set(coverage.flatMap(c => c.names));
    const kept = warnings.filter(w => w.plotline === undefined || !lines.has(w.plotline));
    for (const c of coverage) {
        if (c.open.length === 0) continue;
        const titles = c.open.slice(0, MAX_WARNING_TITLES).map(s => s.title || s.filePath);
        const more = c.open.length - titles.length;
        kept.push({
            severity: 'info',
            category: 'Off page',
            message: `Off page line "${c.line}": ${c.open.length} stage${c.open.length === 1 ? ' is' : 's are'} not yet told in a scene (${titles.join(', ')}${more > 0 ? ` and ${more} more` : ''})`,
            scenePaths: c.open.map(s => s.filePath),
        });
    }
    return kept;
}

/**
 * Body of the "Off Page Coverage" section. `openLines` keeps the open state
 * of each line across refreshes (keyed by the normalized line tag).
 */
export function renderOffPageCoverage(
    body: HTMLElement,
    coverage: OffPageLineCoverage[],
    openScene: (scene: Scene) => void,
    openLines: Map<string, boolean>,
): void {
    body.createEl('p', {
        cls: 'stats-hint',
        text: 'Stages (arc points) on off page lines and whether they are already told in a scene (link them in the inspector).',
    });
    const sceneLink = (parent: HTMLElement, scene: Scene): void => {
        const a = parent.createEl('a', { cls: 'stats-scene-link', text: scene.title || scene.filePath });
        a.addEventListener('click', () => openScene(scene));
    };
    for (const c of coverage) {
        const block = body.createEl('details', { cls: 'stats-offpage-line' });
        const key = normalizePlotlineTag(c.line);
        block.open = openLines.get(key) ?? (c.open.length > 0 && c.open.length <= 8);
        block.addEventListener('toggle', () => openLines.set(key, block.open));
        const summary = block.createEl('summary');
        summary.createSpan({ cls: 'stats-offpage-line-name', text: c.line });
        const total = c.stages.length;
        const pct = total ? Math.round((c.told.length / total) * 100) : 0;
        summary.createSpan('stats-bar').createSpan('stats-bar-fill').setCssStyles({ width: `${pct}%` });
        const sceneCount = c.scenes ? ` · ${c.scenes} scene${c.scenes === 1 ? '' : 's'}` : '';
        summary.createSpan({
            cls: 'stats-offpage-line-count',
            text: total ? `${c.told.length} / ${total} told${sceneCount}` : `no stages${sceneCount}`,
        });

        if (c.open.length) {
            block.createEl('h5', { cls: 'stats-subsection-title', text: 'Not yet told' });
            const ul = block.createEl('ul', { cls: 'stats-list' });
            for (const arc of c.open) sceneLink(ul.createEl('li'), arc);
        }
        if (c.told.length) {
            block.createEl('h5', { cls: 'stats-subsection-title', text: 'Told in' });
            const ul = block.createEl('ul', { cls: 'stats-list' });
            for (const r of c.told) {
                const li = ul.createEl('li');
                sceneLink(li, r.arc);
                li.createSpan({ text: ' → ' });
                sceneLink(li, r.scene);
            }
        }
    }
}
