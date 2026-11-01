// ═══════════════════════════════════════════════════════
//  Per-volume statistics and goals (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Additive section for the Statistics view. Rendered only when the
// project file defines `volumes:`. Uses the scene list the view already
// computed, so nothing in SceneQueryService changes.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { getVolumeForAct, type VolumeDef } from '../utils/volumes';
import { computeOpenSetups } from '../utils/volumeSetups';
import { buildDeadlinePlan, type DeadlinePlan } from '../services/WritingTracker';

export interface VolumeStatsRow {
    volume: VolumeDef;
    scenes: number;
    words: number;
    arcPoints: number;
    progress?: number;      // 0..1 against wordGoal
    /** Same plan as the overview card (upstream buildDeadlinePlan). */
    plan?: DeadlinePlan;
}

/** Options shared with the overview so both show the same numbers. */
export interface VolumeStatsOptions {
    /** Weekend setting of the project deadline (overview uses the same). */
    includeWeekends: boolean;
    /** Project deadline: the "All volumes" row uses it before the latest volume deadline. */
    projectDeadline?: string;
    /** Project word goal: the "All volumes" row uses it if no volume has a goal. */
    projectGoal?: number;
    today?: Date;
}

/** Act list as ranges: [1,2,3] → "1–3", [1,3] → "1, 3", [1,2,3,5] → "1–3, 5". */
export function formatActRanges(acts: number[]): string {
    const sorted = Array.from(new Set(acts)).sort((a, b) => a - b);
    if (sorted.length === 0) return '–';
    const parts: string[] = [];
    let from = sorted[0];
    let prev = sorted[0];
    const flush = () => parts.push(from === prev ? String(from) : `${from}–${prev}`);
    for (const n of sorted.slice(1)) {
        if (n === prev + 1) { prev = n; continue; }
        flush();
        from = prev = n;
    }
    flush();
    return parts.join(', ');
}

/** Progress and deadline plan of a row, with the overview's maths. */
function withMetrics(row: VolumeStatsRow, opts: VolumeStatsOptions): VolumeStatsRow {
    const goal = row.volume.wordGoal;
    if (goal) row.progress = Math.min(1, row.words / goal);
    if (row.volume.deadline) {
        // Without a goal there are no words to plan: still report overdue / days left
        const plan = buildDeadlinePlan(row.volume.deadline, goal || Number.MAX_SAFE_INTEGER,
            goal ? row.words : 0, opts.includeWeekends, opts.today ?? new Date());
        if (plan) row.plan = plan;
    }
    return row;
}

/** Count a scene into a row (arc points separately, like the overview). */
function addScene(row: VolumeStatsRow, s: Scene, excludeArcPoints: boolean): void {
    if (s.arcAnchor) {
        row.arcPoints++;
        if (excludeArcPoints) return;
    } else {
        row.scenes++;
    }
    row.words += s.wordcount || 0;
}

export function computeVolumeStats(
    volumes: VolumeDef[],
    scenes: Scene[],
    excludeArcPoints: boolean,
    opts: VolumeStatsOptions = { includeWeekends: true },
): VolumeStatsRow[] {
    const rows = new Map<string, VolumeStatsRow>();
    for (const v of volumes) rows.set(v.id, { volume: v, scenes: 0, words: 0, arcPoints: 0 });
    for (const s of scenes) {
        const v = getVolumeForAct(volumes, s.act);
        if (v) addScene(rows.get(v.id)!, s, excludeArcPoints);
    }
    return volumes.map(v => withMetrics(rows.get(v.id)!, opts));
}

/**
 * "All volumes" row: counts every given scene, also scenes outside any volume,
 * so it matches the overview with "All volumes" selected. Goal = sum of the
 * volume goals (else the project goal); deadline = project deadline, else the
 * latest volume deadline (same rules as the overview).
 */
export function computeTotalRow(
    volumes: VolumeDef[],
    scenes: Scene[],
    excludeArcPoints: boolean,
    opts: VolumeStatsOptions = { includeWeekends: true },
): VolumeStatsRow & { outside: number } {
    const goals = volumes.map(v => v.wordGoal).filter((g): g is number => !!g);
    const deadlines = volumes.map(v => v.deadline).filter((d): d is string => !!d).sort();
    const total: VolumeStatsRow & { outside: number } = {
        volume: {
            id: '__all__',
            title: 'All volumes',
            acts: volumes.flatMap(v => v.acts),
            wordGoal: goals.length ? goals.reduce((a, b) => a + b, 0) : opts.projectGoal || undefined,
            deadline: opts.projectDeadline || (deadlines.length ? deadlines[deadlines.length - 1] : undefined),
        },
        scenes: 0, words: 0, arcPoints: 0, outside: 0,
    };
    for (const s of scenes) {
        addScene(total, s, excludeArcPoints);
        if (!s.arcAnchor && !getVolumeForAct(volumes, s.act)) total.outside++;
    }
    return Object.assign(withMetrics(total, opts), { outside: total.outside });
}

/** Deadline hint next to the date: "(overdue)", "(12 d)" in writing days, none when the goal is reached. */
export function deadlineHint(plan: DeadlinePlan | undefined): { text: string; overdue: boolean } | undefined {
    if (!plan) return undefined;
    if (plan.overdue) return { text: ' (overdue)', overdue: true };
    if (plan.remainingWords === 0) return undefined;
    return { text: ` (${plan.availableDays} d)`, overdue: false };
}

const OPEN_KEY = 'storyline-km:volumeStatsOpen';

export function renderVolumeStatsSection(
    parent: HTMLElement,
    volumes: VolumeDef[],
    scenes: Scene[],
    excludeArcPoints: boolean,
    openScene?: (scene: Scene) => void,
    onEditVolumes?: () => void,
    selectedVolumeId?: string,
    opts: VolumeStatsOptions & { app?: App } = { includeWeekends: true },
): void {
    if (volumes.length === 0) return;
    const rows = computeVolumeStats(volumes, scenes, excludeArcPoints, opts);

    const details = parent.createEl('details', { cls: 'sl-km-volume-stats' });
    const stored: unknown = opts.app?.loadLocalStorage(OPEN_KEY);
    details.open = typeof stored === 'boolean' ? stored : true;
    details.addEventListener('toggle', () => opts.app?.saveLocalStorage(OPEN_KEY, details.open));
    details.createEl('summary', { text: 'Volumes' });
    if (onEditVolumes) {
        const edit = details.createEl('button', { cls: 'sl-km-edit-volumes', text: 'Edit volumes' });
        edit.addEventListener('click', onEditVolumes);
    }

    const table = details.createEl('table', { cls: 'sl-km-volume-stats-table' });
    const head = table.createEl('thead').createEl('tr');
    ['Volume', 'Acts', 'Scenes', 'Arc Points', 'Words', 'Goal', 'Progress', 'Deadline', 'Words/day'].forEach(h => head.createEl('th', { text: h }));

    const body = table.createEl('tbody');
    const fmt = (n: number) => n.toLocaleString();
    const totalRow = computeTotalRow(volumes, scenes, excludeArcPoints, opts);
    for (const r of [...rows, totalRow]) {
        const tr = body.createEl('tr');
        if (r === totalRow) tr.addClass('sl-km-volume-total');
        if (r.volume.id === (selectedVolumeId || '__all__')) tr.addClass('is-selected');
        const name = tr.createEl('td', { text: r.volume.title });
        if (r === totalRow && totalRow.outside > 0) {
            name.createSpan({ cls: 'sl-km-muted', text: ` (incl. ${fmt(totalRow.outside)} outside volumes)` });
        }
        tr.createEl('td', { text: formatActRanges(r.volume.acts) });
        tr.createEl('td', { text: fmt(r.scenes) });
        tr.createEl('td', { text: fmt(r.arcPoints) });
        tr.createEl('td', { text: fmt(r.words) });
        tr.createEl('td', { text: r.volume.wordGoal ? fmt(r.volume.wordGoal) : '–' });

        const progCell = tr.createEl('td');
        if (r.progress !== undefined) {
            const bar = progCell.createDiv('sl-km-volume-progress');
            const fill = bar.createDiv('sl-km-volume-progress-fill');
            fill.setCssStyles({ width: `${Math.round(r.progress * 100)}%` });
            progCell.createSpan({ text: ` ${Math.round(r.progress * 100)}%` });
        } else {
            progCell.setText('–');
        }

        const dl = tr.createEl('td');
        if (r.volume.deadline) {
            dl.setText(r.volume.deadline);
            const hint = deadlineHint(r.plan);
            if (hint) dl.createSpan({ cls: hint.overdue ? 'sl-km-overdue' : 'sl-km-muted', text: hint.text });
        } else {
            dl.setText('–');
        }
        const perDay = r.volume.wordGoal && r.plan && !r.plan.overdue && r.plan.availableDays > 0 ? r.plan.wordsPerDay : undefined;
        tr.createEl('td', { text: perDay !== undefined ? fmt(perDay) : '–' });
    }

    renderOpenSetups(details, volumes, scenes, openScene);
}

/** "Open setups at end of volume N": setups whose payoff comes later or is missing. */
function renderOpenSetups(
    parent: HTMLElement,
    volumes: VolumeDef[],
    scenes: Scene[],
    openScene?: (scene: Scene) => void,
): void {
    const report = computeOpenSetups(volumes, scenes);
    const wrap = parent.createDiv('sl-km-open-setups');
    wrap.createEl('h4', { text: 'Open setups at end of volume' });
    if (report.every(r => r.open.length === 0)) {
        wrap.createDiv({ cls: 'sl-km-muted', text: 'No open setups: every setup pays off within its volume.' });
        return;
    }
    for (const { volume, open } of report) {
        const d = wrap.createEl('details');
        d.createEl('summary', { text: `${volume.title}: ${open.length} open` });
        const ul = d.createEl('ul');
        for (const o of open) {
            const li = ul.createEl('li');
            const link = li.createEl('a', { text: o.setup.title || o.setup.filePath, href: '#' });
            link.addEventListener('click', (e) => { e.preventDefault(); openScene?.(o.setup); });
            // Every entry has at least one payoff link (setups come from links)
            li.createSpan({ cls: 'sl-km-muted', text: ` → ${o.payoffs.map(p => `${p.title} (${p.where})`).join(', ')}` });
        }
    }
}
