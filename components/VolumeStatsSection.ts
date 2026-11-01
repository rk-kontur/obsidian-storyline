// ═══════════════════════════════════════════════════════
//  Per-volume statistics and goals (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Additive section for the Statistics view. Rendered only when the
// project file defines `volumes:`. Uses the scene list the view already
// computed, so nothing in SceneQueryService changes.

import type { Scene } from '../models/Scene';
import { getVolumeForAct, type VolumeDef } from '../utils/volumes';
import { computeOpenSetups } from '../utils/volumeSetups';

export interface VolumeStatsRow {
    volume: VolumeDef;
    scenes: number;
    words: number;
    arcPoints: number;
    progress?: number;      // 0..1 against wordGoal
    daysLeft?: number;      // until deadline
    wordsPerDay?: number;   // needed to reach the goal by the deadline
}

export function computeVolumeStats(
    volumes: VolumeDef[],
    scenes: Scene[],
    excludeArcPoints: boolean,
    today: Date = new Date(),
): VolumeStatsRow[] {
    const rows = new Map<string, VolumeStatsRow>();
    for (const v of volumes) rows.set(v.id, { volume: v, scenes: 0, words: 0, arcPoints: 0 });

    for (const s of scenes) {
        const v = getVolumeForAct(volumes, s.act);
        if (!v) continue;
        const row = rows.get(v.id)!;
        if (s.arcAnchor) {
            row.arcPoints++;
            if (excludeArcPoints) continue;
        } else {
            row.scenes++;
        }
        row.words += s.wordcount || 0;
    }

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    for (const row of rows.values()) {
        const goal = row.volume.wordGoal;
        if (goal) row.progress = Math.min(1, row.words / goal);
        if (row.volume.deadline) {
            const d = new Date(row.volume.deadline);
            if (!isNaN(d.getTime())) {
                row.daysLeft = Math.ceil((d.getTime() - startOfToday) / 86400000);
                if (goal && row.daysLeft > 0) {
                    row.wordsPerDay = Math.max(0, Math.ceil((goal - row.words) / row.daysLeft));
                }
            }
        }
    }
    return volumes.map(v => rows.get(v.id)!);
}

/**
 * "All volumes" row: sums of all volume rows. Goal = sum of the volume goals
 * that are set, deadline = latest volume deadline.
 */
export function computeTotalRow(rows: VolumeStatsRow[], today: Date = new Date()): VolumeStatsRow {
    const goals = rows.map(r => r.volume.wordGoal).filter((g): g is number => !!g);
    const deadlines = rows.map(r => r.volume.deadline).filter((d): d is string => !!d).sort();
    const total: VolumeStatsRow = {
        volume: {
            id: '__all__',
            title: 'All volumes',
            acts: rows.flatMap(r => r.volume.acts).sort((a, b) => a - b),
            wordGoal: goals.length ? goals.reduce((a, b) => a + b, 0) : undefined,
            deadline: deadlines.length ? deadlines[deadlines.length - 1] : undefined,
        },
        scenes: rows.reduce((a, r) => a + r.scenes, 0),
        words: rows.reduce((a, r) => a + r.words, 0),
        arcPoints: rows.reduce((a, r) => a + r.arcPoints, 0),
    };
    // Reuse the per-volume maths for progress, days left and words per day
    return computeVolumeStatsRowMetrics(total, today);
}

function computeVolumeStatsRowMetrics(row: VolumeStatsRow, today: Date): VolumeStatsRow {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const goal = row.volume.wordGoal;
    if (goal) row.progress = Math.min(1, row.words / goal);
    if (row.volume.deadline) {
        const d = new Date(row.volume.deadline);
        if (!isNaN(d.getTime())) {
            row.daysLeft = Math.ceil((d.getTime() - startOfToday) / 86400000);
            if (goal && row.daysLeft > 0) row.wordsPerDay = Math.max(0, Math.ceil((goal - row.words) / row.daysLeft));
        }
    }
    return row;
}

export function renderVolumeStatsSection(
    parent: HTMLElement,
    volumes: VolumeDef[],
    scenes: Scene[],
    excludeArcPoints: boolean,
    openScene?: (scene: Scene) => void,
    onEditVolumes?: () => void,
    selectedVolumeId?: string,
): void {
    if (volumes.length === 0) return;
    const rows = computeVolumeStats(volumes, scenes, excludeArcPoints);

    const details = parent.createEl('details', { cls: 'sl-km-volume-stats' });
    details.open = true;
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
    const totalRow = computeTotalRow(rows);
    for (const r of [...rows, totalRow]) {
        const tr = body.createEl('tr');
        if (r === totalRow) tr.addClass('sl-km-volume-total');
        if (r.volume.id === (selectedVolumeId || '__all__')) tr.addClass('is-selected');
        tr.createEl('td', { text: r.volume.title });
        const acts = r.volume.acts;
        tr.createEl('td', { text: acts.length === 0 ? '–' : acts.length > 1 ? `${acts[0]}–${acts[acts.length - 1]}` : String(acts[0]) });
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
            if (r.daysLeft !== undefined) {
                dl.createSpan({
                    cls: r.daysLeft < 0 ? 'sl-km-overdue' : 'sl-km-muted',
                    text: r.daysLeft < 0 ? ` (${-r.daysLeft} d overdue)` : ` (${r.daysLeft} d)`,
                });
            }
        } else {
            dl.setText('–');
        }
        tr.createEl('td', { text: r.wordsPerDay !== undefined ? fmt(r.wordsPerDay) : '–' });
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
            const targets = o.payoffs.length
                ? o.payoffs.map(p => `${p.title} (${p.where})`).join(', ')
                : 'no payoff';
            li.createSpan({ cls: 'sl-km-muted', text: ` → ${targets}` });
        }
    }
}
