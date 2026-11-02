// ═══════════════════════════════════════════════════════
//  Plot Grid helpers for volumes (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// While a volume is selected, auto columns (created by "Sync from scenes",
// e.g. plotlines) without any content in the visible rows are hidden, just
// like the Subway map only draws lines that are active in the volume.
// Manually created columns always stay visible. Hidden columns keep their
// cells; the grid track just gets width 0.

import type { PlotGridData } from '../models/PlotGridData';

/** Indices of auto columns that have no content and no linked scene in the visible rows. */
export function findEmptyAutoColumns(data: PlotGridData, visibleRows: Set<number>): Set<number> {
    const hidden = new Set<number>();
    data.columns.forEach((col, ci) => {
        if (col.sourceType !== 'auto') return;
        for (const ri of visibleRows) {
            const row = data.rows[ri];
            if (!row) continue;
            const cell = data.cells[`${row.id}-${col.id}`];
            if (cell && ((cell.content && String(cell.content).trim()) || cell.linkedSceneId)) return;
        }
        hidden.add(ci);
    });
    return hidden;
}

/** Grid column template with hidden columns collapsed to 0 px. */
export function columnTemplate(labelWidth: number, data: PlotGridData, hidden: Set<number>): string {
    return [labelWidth + 'px', ...data.columns.map((c, ci) => (hidden.has(ci) ? 0 : c.width) + 'px')].join(' ');
}

/** Width of the hidden columns (to subtract from the canvas width). */
export function hiddenColumnsWidth(data: PlotGridData, hidden: Set<number>): number {
    let w = 0;
    hidden.forEach(ci => { w += data.columns[ci]?.width ?? 0; });
    return w;
}

/** Hint "N empty columns hidden · show" at the right of the filter bar. */
export function renderHiddenColumnsHint(bar: HTMLElement, onToggle: () => void): HTMLElement {
    const hint = bar.createEl('button', { cls: 'sl-km-hidden-cols-hint clickable-icon' });
    hint.hide();
    hint.addEventListener('click', onToggle);
    return hint;
}

/** Singular/plural noun for an auto column kind (sourceKind of "Sync from scenes"). */
function kindNoun(kind: string | undefined, n: number): [string, string] {
    const one = n === 1;
    if (kind === 'tags') return ['plotline', one ? 'plotline' : 'plotlines'];
    if (kind === 'characters') return ['character', one ? 'character' : 'characters'];
    if (kind === 'locations') return ['location', one ? 'location' : 'locations'];
    if (kind?.startsWith('codex:')) return ['codex', one ? 'codex column' : 'codex columns'];
    return ['other', one ? 'column' : 'columns'];
}

/**
 * Text of the hint: "3 empty plotlines hidden · show" when all hidden columns
 * are of one kind, else "5 empty columns hidden (3 plotlines, 2 characters) · show".
 */
export function hiddenColumnsHintText(data: PlotGridData, hidden: Set<number>, showingAll: boolean): string {
    if (showingAll) return 'Hide empty columns';
    const counts = new Map<string, { n: number; kind: string | undefined }>();
    hidden.forEach(ci => {
        const kind = data.columns[ci]?.sourceKind;
        const key = kindNoun(kind, 1)[0];
        const e = counts.get(key);
        if (e) e.n++; else counts.set(key, { n: 1, kind });
    });
    const total = hidden.size;
    if (counts.size === 1) {
        const { kind } = [...counts.values()][0];
        return `${total} empty ${kindNoun(kind, total)[1]} hidden · show`;
    }
    const parts = [...counts.values()].map(e => `${e.n} ${kindNoun(e.kind, e.n)[1]}`);
    return `${total} empty column${total === 1 ? '' : 's'} hidden (${parts.join(', ')}) · show`;
}

export function updateHiddenColumnsHint(hint: HTMLElement | null, data: PlotGridData, hidden: Set<number>, showingAll: boolean, scoped: boolean): void {
    if (!hint) return;
    if (!scoped || (hidden.size === 0 && !showingAll)) { hint.hide(); return; }
    hint.show();
    hint.setText(hiddenColumnsHintText(data, hidden, showingAll));
}

/** First (or last, with `fromEnd`) column index that is not hidden, or null if all are hidden. */
export function firstVisibleColumn(count: number, hidden: Set<number>, fromEnd = false): number | null {
    for (let i = 0; i < count; i++) {
        const c = fromEnd ? count - 1 - i : i;
        if (!hidden.has(c)) return c;
    }
    return null;
}

/**
 * Keyboard step over the columns that are not hidden: moves |dx| visible
 * columns in the direction of dx and stops at the last visible column at the
 * edge (like the upstream clamp). If `from` itself is hidden and no step was
 * possible (dx 0, or nothing visible that way), the nearest visible column is
 * used, preferring the direction of dx. Returns null only if every column is hidden.
 */
export function stepVisibleColumn(from: number, dx: number, count: number, hidden: Set<number>): number | null {
    if (count <= 0) return null;
    from = Math.max(0, Math.min(count - 1, from));
    const dir = dx < 0 ? -1 : 1;
    let res: number | null = hidden.has(from) ? null : from;
    let remaining = Math.abs(dx);
    for (let c = from + dir; remaining > 0 && c >= 0 && c < count; c += dir) {
        if (!hidden.has(c)) { res = c; remaining--; }
    }
    if (res !== null) return res;
    // `from` is hidden: nearest visible column, first in the direction of dx, then on the other side
    for (const d of [dir, -dir]) {
        for (let c = from + d; c >= 0 && c < count; c += d) {
            if (!hidden.has(c)) return c;
        }
    }
    return null;
}

/**
 * Tab / Shift+Tab target while editing: the next visible column in the row,
 * else the first (last) visible column of the next (previous) row, with the
 * same row clamping as upstream. Null if every column is hidden.
 */
export function tabTarget(row: number, col: number, back: boolean, rowCount: number, colCount: number, hidden: Set<number>): { row: number; col: number } | null {
    const dir = back ? -1 : 1;
    for (let c = col + dir; c >= 0 && c < colCount; c += dir) {
        if (!hidden.has(c)) return { row, col: c };
    }
    const nc = firstVisibleColumn(colCount, hidden, back);
    if (nc === null) return null;
    const nr = back ? Math.max(0, row - 1) : Math.min(rowCount - 1, row + 1);
    return { row: nr, col: nc };
}
