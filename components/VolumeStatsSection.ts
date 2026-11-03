// "Volumes" section at the top of the Statistics view: one row per volume
// (acts, scenes, arc points, words, goal, progress, deadline, words per day),
// an "All volumes" total row and the setups still open at the end of each
// volume. Rendered only when the project file defines `volumes:`.

import type SceneCardsPlugin from '../main';
import type { Scene } from '../models/Scene';
import { buildDeadlinePlan, type DeadlinePlan } from '../services/WritingTracker';
import { openVolumesDialog } from '../services/StructureCommands';
import { getVolumeForAct, type VolumeDef } from '../utils/volumes';
import { computeOpenSetups, latestVolumeDeadline, totalVolumeGoal, type StatsScope } from '../utils/volumeStats';

export interface VolumeStatsRow {
    volume: VolumeDef;
    scenes: number;
    arcPoints: number;
    words: number;
    /** 0..1 against the word goal. */
    progress?: number;
    /** Same plan as the overview's deadline (buildDeadlinePlan). */
    plan?: DeadlinePlan;
}

export interface VolumeStatsOptions {
    excludeArcPoints: boolean;
    /** Weekend setting of the project deadline, as in the overview. */
    includeWeekends: boolean;
    /** "All volumes" row: used before the latest volume deadline. */
    projectDeadline?: string;
    /** "All volumes" row: used if no volume has a word goal. */
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

/** Count a scene into a row; arc points separately, like the overview. */
function addScene(row: VolumeStatsRow, s: Scene, excludeArcPoints: boolean): void {
    if (s.arcAnchor) {
        row.arcPoints++;
        if (excludeArcPoints) return;
    } else {
        row.scenes++;
    }
    row.words += s.wordcount || 0;
}

/** Progress and deadline plan with the overview's maths (local time, weekend setting). */
function withMetrics<T extends VolumeStatsRow>(row: T, opts: VolumeStatsOptions): T {
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

export function computeVolumeRows(volumes: VolumeDef[], scenes: Scene[], opts: VolumeStatsOptions): VolumeStatsRow[] {
    const rows = new Map<string, VolumeStatsRow>(volumes.map(v => [v.id, { volume: v, scenes: 0, arcPoints: 0, words: 0 }]));
    for (const s of scenes) {
        const row = rows.get(getVolumeForAct(volumes, s.act)?.id ?? '');
        if (row) addScene(row, s, opts.excludeArcPoints);
    }
    return [...rows.values()].map(r => withMetrics(r, opts));
}

/**
 * "All volumes" row: every scene, also scenes outside every volume, so it
 * matches the overview with "All volumes" selected. Goal and deadline follow
 * the overview's rules.
 */
export function computeTotalRow(volumes: VolumeDef[], scenes: Scene[], opts: VolumeStatsOptions): VolumeStatsRow & { outside: number } {
    const total = {
        volume: {
            id: '',
            title: 'All volumes',
            acts: volumes.flatMap(v => v.acts),
            wordGoal: totalVolumeGoal(volumes) || opts.projectGoal || undefined,
            deadline: opts.projectDeadline || latestVolumeDeadline(volumes),
        },
        scenes: 0, arcPoints: 0, words: 0, outside: 0,
    };
    for (const s of scenes) {
        addScene(total, s, opts.excludeArcPoints);
        if (!s.arcAnchor && !getVolumeForAct(volumes, s.act)) total.outside++;
    }
    return withMetrics(total, opts);
}

/** Hint after the deadline: " (overdue)", " (12 d)" in writing days, none once the goal is reached. */
export function deadlineHint(plan: DeadlinePlan | undefined): { text: string; overdue: boolean } | undefined {
    if (!plan) return undefined;
    if (plan.overdue) return { text: ' (overdue)', overdue: true };
    if (plan.remainingWords === 0) return undefined;
    return { text: ` (${plan.availableDays} d)`, overdue: false };
}

const OPEN_KEY = 'storyline-volume-stats-open';

export function renderVolumeStatsSection(parent: HTMLElement, plugin: SceneCardsPlugin, scope: StatsScope): void {
    const { volumes } = scope;
    if (volumes.length === 0) return;
    const { app } = plugin;
    const projectDeadline = plugin.writingTracker.getProjectDeadline();
    const opts: VolumeStatsOptions = {
        excludeArcPoints: plugin.settings.excludeArcAnchorFromWordcount ?? true,
        includeWeekends: projectDeadline.includeWeekends,
        projectDeadline: projectDeadline.deadline,
        projectGoal: plugin.settings.projectWordGoal,
    };
    const scenes = scope.projectScenes;

    const details = parent.createEl('details', { cls: 'story-line-volume-stats' });
    const stored: unknown = app.loadLocalStorage(OPEN_KEY);
    details.open = typeof stored === 'boolean' ? stored : true;
    details.addEventListener('toggle', () => app.saveLocalStorage(OPEN_KEY, details.open));
    details.createEl('summary', { text: 'Volumes' });
    const edit = details.createEl('button', { cls: 'story-line-volume-stats-edit', text: 'Edit volumes' });
    edit.addEventListener('click', () => { void openVolumesDialog(plugin); });

    // Wide tables scroll inside the frame, like the character × chapter heatmap
    const table = details.createDiv('story-line-volume-stats-scroll').createEl('table', { cls: 'story-line-volume-stats-table' });
    const head = table.createEl('thead').createEl('tr');
    for (const h of ['Volume', 'Acts', 'Scenes', 'Arc Points', 'Words', 'Goal', 'Progress', 'Deadline', 'Words/day']) {
        head.createEl('th', { text: h });
    }

    const body = table.createEl('tbody');
    const fmt = (n: number) => n.toLocaleString();
    const totalRow = computeTotalRow(volumes, scenes, opts);
    for (const r of [...computeVolumeRows(volumes, scenes, opts), totalRow]) {
        const tr = body.createEl('tr');
        tr.toggleClass('is-total', r === totalRow);
        tr.toggleClass('is-selected', r.volume.id === (scope.volume?.id ?? ''));
        const name = tr.createEl('td', { text: r.volume.title });
        if (r === totalRow && totalRow.outside > 0) {
            name.createSpan({ cls: 'story-line-volume-stats-muted', text: ` (incl. ${fmt(totalRow.outside)} outside volumes)` });
        }
        tr.createEl('td', { text: formatActRanges(r.volume.acts) });
        tr.createEl('td', { text: fmt(r.scenes) });
        tr.createEl('td', { text: fmt(r.arcPoints) });
        tr.createEl('td', { text: fmt(r.words) });
        tr.createEl('td', { text: r.volume.wordGoal ? fmt(r.volume.wordGoal) : '–' });

        const progress = tr.createEl('td');
        if (r.progress !== undefined) {
            const pct = Math.round(r.progress * 100);
            progress.createDiv('story-line-volume-stats-bar').createDiv('story-line-volume-stats-bar-fill')
                .setCssStyles({ width: `${pct}%` });
            progress.createSpan({ text: ` ${pct}%` });
        } else {
            progress.setText('–');
        }

        const deadline = tr.createEl('td', { text: r.volume.deadline || '–' });
        const hint = deadlineHint(r.plan);
        if (hint) deadline.createSpan({ cls: hint.overdue ? 'stats-deadline-overdue' : 'story-line-volume-stats-muted', text: hint.text });
        const perDay = r.volume.wordGoal && r.plan && !r.plan.overdue && r.plan.availableDays > 0 ? r.plan.wordsPerDay : undefined;
        tr.createEl('td', { text: perDay !== undefined ? fmt(perDay) : '–' });
    }

    renderOpenSetups(details, plugin, volumes, scenes);
}

/** "Open setups at end of volume": setups whose payoff comes later, in no volume, or is missing. */
function renderOpenSetups(parent: HTMLElement, plugin: SceneCardsPlugin, volumes: VolumeDef[], scenes: Scene[]): void {
    const report = computeOpenSetups(volumes, scenes);
    const wrap = parent.createDiv('story-line-volume-stats-setups');
    wrap.createEl('h4', { text: 'Open setups at end of volume' });
    if (report.every(r => r.open.length === 0)) {
        wrap.createDiv({ cls: 'story-line-volume-stats-muted', text: 'No open setups: every setup pays off within its volume.' });
        return;
    }
    for (const { volume, open } of report) {
        const d = wrap.createEl('details');
        d.createEl('summary', { text: `${volume.title}: ${open.length} open` });
        const ul = d.createEl('ul');
        for (const o of open) {
            const li = ul.createEl('li');
            const link = li.createEl('a', { text: o.setup.title || o.setup.filePath, href: '#' });
            link.addEventListener('click', (e) => {
                e.preventDefault();
                void plugin.app.workspace.openLinkText(o.setup.filePath, '', true);
            });
            li.createSpan({
                cls: 'story-line-volume-stats-muted',
                text: ` → ${o.payoffs.map(p => `${p.title} (${p.where})`).join(', ')}`,
            });
        }
    }
}
