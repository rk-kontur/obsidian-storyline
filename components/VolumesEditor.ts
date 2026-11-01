// ═══════════════════════════════════════════════════════
//  Volumes editor (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Edits the optional `volumes:` block of the project file. Used as the
// "Volumes" tab of the "Manage story structure" dialog.

import { Notice, TFile } from 'obsidian';
import type { App } from 'obsidian';
import { getProjectVolumes, type VolumeDef } from '../utils/volumes';

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

async function saveVolumes(app: App, projectFilePath: string, volumes: EditableVolume[]): Promise<void> {
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) {
        new Notice('Project file not found.');
        return;
    }
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        if (volumes.length === 0) { delete fm.volumes; return; }
        fm.volumes = volumes.map(v => {
            const out: Record<string, unknown> = { id: v.id, title: v.title, acts: v.acts };
            if (v.wordGoal) out.wordGoal = v.wordGoal;
            if (v.deadline) out.deadline = v.deadline;
            return out;
        });
    });
}

export function renderVolumesEditor(
    container: HTMLElement,
    app: App,
    projectFilePath: string | undefined,
    definedActs: number[],
): void {
    container.empty();
    container.addClass('sl-km-volumes-editor');
    container.createEl('p', {
        cls: 'setting-item-description',
        text: 'A volume is a named group of acts. Scenes, numbering and file names stay as they are; a scene belongs to the volume of its act.',
    });
    if (!projectFilePath) {
        container.createEl('p', { cls: 'structure-empty', text: 'No active project.' });
        return;
    }

    const volumes: EditableVolume[] = getProjectVolumes(app, projectFilePath)
        .map((v: VolumeDef) => ({ ...v, acts: [...v.acts] }));

    const list = container.createDiv('sl-km-volumes-list');
    const warn = container.createDiv('sl-km-volumes-warning');
    let saveTimer: number | null = null;
    const scheduleSave = () => {
        if (saveTimer) window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => { void saveVolumes(app, projectFilePath, volumes); }, 400);
    };

    const render = () => {
        list.empty();
        warn.empty();
        if (volumes.length === 0) {
            list.createEl('p', { cls: 'structure-empty', text: 'No volumes defined yet.' });
        } else {
            const head = list.createDiv('sl-km-volume-row sl-km-volume-head');
            ['Title', 'From act', 'To act', 'Word goal', 'Deadline', ''].forEach(t => head.createSpan({ text: t }));
        }
        const overlaps = findOverlaps(volumes);

        volumes.forEach((v, i) => {
            const row = list.createDiv('sl-km-volume-row');
            if (overlaps.has(i)) row.addClass('has-overlap');

            const title = row.createEl('input', { type: 'text', value: v.title });
            title.addEventListener('change', () => { v.title = title.value.trim() || `Volume ${i + 1}`; scheduleSave(); });

            const contiguous = v.acts.every((a, k) => k === 0 || a === v.acts[k - 1] + 1);
            const from = row.createEl('input', { type: 'number', value: String(v.acts[0] ?? '') });
            const to = row.createEl('input', { type: 'number', value: String(v.acts[v.acts.length - 1] ?? '') });
            if (!contiguous) {
                from.title = to.title = `Acts ${rangeText(v.acts)} (editing turns this into a range)`;
            }
            const onRange = () => {
                const f = parseInt(from.value, 10);
                const t = parseInt(to.value, 10);
                if (isNaN(f) || isNaN(t) || f < 0 || t < 0) return;
                v.acts = toRange(f, t);
                scheduleSave();
                render();
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

            const del = row.createEl('button', { cls: 'clickable-icon structure-remove', text: '×', attr: { 'aria-label': `Remove ${v.title}` } });
            del.addEventListener('click', () => { volumes.splice(i, 1); scheduleSave(); render(); });

            row.querySelectorAll('input').forEach(inp => inp.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation()));
        });

        if (overlaps.size > 0) {
            const parts = [...overlaps.entries()].map(([i, acts]) => `${volumes[i].title}: act ${acts.join(', ')}`);
            warn.setText(`Acts assigned to more than one volume (the first volume wins): ${parts.join('; ')}`);
        }

        // Defined acts not covered by any volume
        const covered = new Set(volumes.flatMap(v => v.acts));
        const free = definedActs.filter(a => !covered.has(a) && a !== 0 && a !== 99);
        if (volumes.length > 0 && free.length > 0) {
            warn.createDiv({ cls: 'sl-km-muted', text: `Acts without volume: ${free.join(', ')}` });
        }
    };

    const addRow = container.createDiv('structure-add-row sl-km-volumes-add');
    const addBtn = addRow.createEl('button', { cls: 'mod-cta', text: '+ Add volume' });
    addBtn.addEventListener('click', () => {
        const used = volumes.flatMap(v => v.acts);
        const lastSize = volumes.length ? volumes[volumes.length - 1].acts.length : 4;
        const start = used.length ? Math.max(...used) + 1 : (definedActs.filter(a => a > 0 && a !== 99)[0] ?? 1);
        const ids = new Set(volumes.map(v => v.id));
        let n = volumes.length + 1;
        while (ids.has(`v${n}`)) n++;
        volumes.push({ id: `v${n}`, title: `Volume ${volumes.length + 1}`, acts: toRange(start, start + Math.max(1, lastSize) - 1) });
        scheduleSave();
        render();
    });

    render();
}
