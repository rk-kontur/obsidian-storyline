// ═══════════════════════════════════════════════════════
//  Plot Grid: empty auto columns hidden under a volume selection
// ═══════════════════════════════════════════════════════
//
// While a volume is selected, auto columns (created by "Sync from scenes",
// e.g. plotlines) without content in the shown rows are hidden, like the
// Subway map only draws lines that are active in the volume. Columns created
// by hand always stay. Hidden columns keep their cells; their grid track gets
// width 0. With an empty set every helper behaves like the plain grid.

import type { PlotGridData } from '../models/PlotGridData';

/** Indices of auto columns that have no content and no linked scene in the given rows. */
export function findEmptyAutoColumns(data: PlotGridData, rows: Set<number>): Set<number> {
    const hidden = new Set<number>();
    data.columns.forEach((col, ci) => {
        if (col.sourceType !== 'auto') return;
        for (const ri of rows) {
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

/** Total width of the hidden columns. */
export function hiddenColumnsWidth(data: PlotGridData, hidden: Set<number>): number {
    let w = 0;
    hidden.forEach(ci => { w += data.columns[ci]?.width ?? 0; });
    return w;
}

/** Plural noun for the kind of an auto column. */
function kindNoun(kind: string | undefined, n: number): string {
    const one = n === 1;
    if (kind === 'tags') return one ? 'plotline' : 'plotlines';
    if (kind === 'characters') return one ? 'character' : 'characters';
    if (kind === 'locations') return one ? 'location' : 'locations';
    if (kind?.startsWith('codex:')) return one ? 'codex column' : 'codex columns';
    return one ? 'column' : 'columns';
}

/**
 * Hint text: "3 empty plotlines hidden · show" when all hidden columns are of
 * one kind, else "5 empty columns hidden (3 plotlines, 2 characters) · show".
 */
export function hiddenColumnsHintText(data: PlotGridData, hidden: Set<number>, showingAll: boolean): string {
    if (showingAll) return 'Hide empty columns';
    const counts = new Map<string, { n: number; kind: string | undefined }>();
    hidden.forEach(ci => {
        const kind = data.columns[ci]?.sourceKind;
        const key = kind?.startsWith('codex:') ? 'codex' : (kind ?? '');
        const e = counts.get(key);
        if (e) e.n++; else counts.set(key, { n: 1, kind });
    });
    const total = hidden.size;
    if (counts.size === 1) {
        const { kind } = [...counts.values()][0];
        return `${total} empty ${kindNoun(kind, total)} hidden · show`;
    }
    const parts = [...counts.values()].map(e => `${e.n} ${kindNoun(e.kind, e.n)}`);
    return `${total} empty ${kindNoun(undefined, total)} hidden (${parts.join(', ')}) · show`;
}

/** First (or last, with `fromEnd`) column that is not hidden, or null if all are hidden. */
export function firstVisibleColumn(count: number, hidden: Set<number>, fromEnd = false): number | null {
    for (let i = 0; i < count; i++) {
        const c = fromEnd ? count - 1 - i : i;
        if (!hidden.has(c)) return c;
    }
    return null;
}

/**
 * Keyboard step over the columns that are not hidden: moves |dx| visible
 * columns and stops at the last visible column at the edge. If `from` is
 * hidden and no step is possible, the nearest visible column is used,
 * preferring the direction of dx. Null only if every column is hidden.
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
    for (const d of [dir, -dir]) {
        for (let c = from + d; c >= 0 && c < count; c += d) {
            if (!hidden.has(c)) return c;
        }
    }
    return null;
}
