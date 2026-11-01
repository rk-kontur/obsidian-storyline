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

/** "N empty plotlines hidden · show" hint at the right of the filter bar. */
export function renderHiddenColumnsHint(bar: HTMLElement, onToggle: () => void): HTMLElement {
    const hint = bar.createEl('button', { cls: 'sl-km-hidden-cols-hint clickable-icon' });
    hint.hide();
    hint.addEventListener('click', onToggle);
    return hint;
}

export function updateHiddenColumnsHint(hint: HTMLElement | null, hiddenCount: number, showingAll: boolean, scoped: boolean): void {
    if (!hint) return;
    if (!scoped || (hiddenCount === 0 && !showingAll)) { hint.hide(); return; }
    hint.show();
    hint.setText(showingAll
        ? 'Hide empty plotlines'
        : `${hiddenCount} empty plotline${hiddenCount === 1 ? '' : 's'} hidden · show`);
}
