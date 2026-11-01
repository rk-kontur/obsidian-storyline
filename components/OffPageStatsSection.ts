// ═══════════════════════════════════════════════════════
//  Statistics for off page plotlines (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Off page plotlines (offPageLines in the project file) carry stages that
// happen in the background: character arcs, technology, politics, genre
// conventions. Their Arc Points are "realized" when they are linked to the
// scene that tells them (realizedBy). This module reports, per off page
// line, how many stages already reach the text, and adjusts the Validator
// warnings: gaps between acts are normal for such lines and are not
// reported; unrealized stages are listed instead.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import type { PlotWarning } from '../services/Validator';
import { resolveRealizingScene } from '../utils/arcRealization';
import { normalizePlotlineTag } from '../utils/pageZones';

export interface OffPageLineCoverage {
    /** Display name: the scene tag as written, or the normalized entry if spelled several ways */
    line: string;
    /** Raw scene tags that match this entry (the names the Validator uses) */
    names: string[];
    /** Arc Points on this line (within the current scope) */
    stages: Scene[];
    realized: { arc: Scene; scene: Scene }[];
    open: Scene[];
    /** Regular scenes on this line (an off page line may also hold scenes) */
    scenes: number;
}

export function computeOffPageCoverage(
    app: App,
    offPageLines: Set<string>,
    scopedScenes: Scene[],
    projectScenes: Scene[],
): OffPageLineCoverage[] {
    if (offPageLines.size === 0) return [];
    // Entries are normalized (pageZones); scene tags may be written by hand ("Mark")
    const rawNames = new Map<string, Set<string>>();
    for (const t of projectScenes.flatMap(s => s.tags ?? [])) {
        const key = normalizePlotlineTag(t);
        if (!rawNames.has(key)) rawNames.set(key, new Set());
        rawNames.get(key)!.add(t);
    }
    // Ignore orphaned entries (hand-edited or left over): only lines that exist as a tag
    const lines = [...offPageLines].filter(l => rawNames.has(l));
    if (lines.length === 0) return [];
    const targets = projectScenes.filter(s => !s.arcAnchor);
    return lines.sort((a, b) => a.localeCompare(b)).map(key => {
        const names = [...(rawNames.get(key) ?? [])];
        const line = names.length === 1 ? names[0] : key;
        const onLine = scopedScenes.filter(s => s.tags?.some(t => normalizePlotlineTag(t) === key));
        const stages = onLine.filter(s => s.arcAnchor)
            .sort((a, b) => (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0));
        const realized: { arc: Scene; scene: Scene }[] = [];
        const open: Scene[] = [];
        for (const arc of stages) {
            const scene = resolveRealizingScene(app, arc, targets);
            if (scene) realized.push({ arc, scene }); else open.push(arc);
        }
        return { line, names, stages, realized, open, scenes: onLine.length - stages.length };
    });
}

/** Text for the overview card, e.g. "12 / 30". */
export function offPageCardValue(coverage: OffPageLineCoverage[]): string {
    const total = coverage.reduce((n, c) => n + c.stages.length, 0);
    const done = coverage.reduce((n, c) => n + c.realized.length, 0);
    return `${done} / ${total}`;
}

/** Stage titles listed in one off page warning before "and N more". */
const MAX_WARNING_TITLES = 5;

/**
 * Validator warnings adjusted for off page lines: act gap warnings for these
 * lines are dropped, unrealized stages are reported per line instead.
 */
export function adjustOffPageWarnings(warnings: PlotWarning[], coverage: OffPageLineCoverage[]): PlotWarning[] {
    if (coverage.length === 0) return warnings;
    const lines = coverage.flatMap(c => c.names);
    const kept = warnings.filter(w => !(w.category === 'Plotlines' && lines.some(l => w.message.startsWith(`Plotline "${l}"`))));
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

/** "Off page coverage" section body. */
export function renderOffPageCoverage(
    body: HTMLElement,
    coverage: OffPageLineCoverage[],
    openScene: (scene: Scene) => void,
): void {
    body.createEl('p', {
        cls: 'stats-hint',
        text: 'Stages (arc points) on off page lines and whether they are already told in a scene (link them in the inspector).',
    });
    for (const c of coverage) {
        const block = body.createEl('details', { cls: 'sl-km-offpage-line' });
        block.open = c.open.length > 0 && c.open.length <= 8;
        const summary = block.createEl('summary');
        summary.createSpan({ cls: 'sl-km-offpage-line-name', text: c.line });
        const total = c.stages.length;
        const pct = total ? Math.round((c.realized.length / total) * 100) : 0;
        const bar = summary.createSpan('sl-km-volume-progress');
        bar.createDiv('sl-km-volume-progress-fill').setCssStyles({ width: `${pct}%` });
        summary.createSpan({
            cls: 'sl-km-muted',
            text: total
                ? ` ${c.realized.length} / ${total} realized${c.scenes ? ` · ${c.scenes} scene${c.scenes === 1 ? '' : 's'}` : ''}`
                : ` no stages${c.scenes ? ` · ${c.scenes} scene${c.scenes === 1 ? '' : 's'}` : ''}`,
        });

        if (c.open.length) {
            block.createDiv({ cls: 'sl-km-offpage-subhead', text: 'Not yet told' });
            const ul = block.createEl('ul');
            for (const arc of c.open) {
                const a = ul.createEl('li').createEl('a', { text: arc.title || arc.filePath, href: '#' });
                a.addEventListener('click', e => { e.preventDefault(); openScene(arc); });
            }
        }
        if (c.realized.length) {
            block.createDiv({ cls: 'sl-km-offpage-subhead', text: 'Told in' });
            const ul = block.createEl('ul');
            for (const r of c.realized) {
                const li = ul.createEl('li');
                const a = li.createEl('a', { text: r.arc.title || r.arc.filePath, href: '#' });
                a.addEventListener('click', e => { e.preventDefault(); openScene(r.arc); });
                li.createSpan({ cls: 'sl-km-muted', text: ' → ' });
                const b = li.createEl('a', { text: r.scene.title || r.scene.filePath, href: '#' });
                b.addEventListener('click', e => { e.preventDefault(); openScene(r.scene); });
            }
        }
    }
}
