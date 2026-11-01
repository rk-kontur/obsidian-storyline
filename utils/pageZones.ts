// ═══════════════════════════════════════════════════════
//  On page / off page zones in the Subway map (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// A plotline can be marked "off page": a development that happens in the
// background (a character arc, technology, politics, genre conventions …)
// rather than in the written scenes. This is an explicit choice per
// plotline, independent of whether it holds scenes or Arc Points.
//
// Stored in the project file frontmatter:
//
//   offPageLines: [Mark, Politics]
//
// The Subway map shows on-page lines first and the off-page lines below in
// their own tinted band. Without `offPageLines` nothing changes.

import { Menu, TFile } from 'obsidian';
import type { App } from 'obsidian';

export const OFF_PAGE_KEY = 'offPageLines';

/** Vertical space added above the off-page band (room for its header). */
export const ZONE_GAP = 44;

export function getOffPageLines(app: App, projectFilePath: string | undefined | null): Set<string> {
    if (!projectFilePath) return new Set();
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return new Set();
    const raw: unknown = app.metadataCache.getFileCache(file)?.frontmatter?.[OFF_PAGE_KEY];
    if (Array.isArray(raw)) return new Set(raw.map(v => String(v).trim()).filter(Boolean));
    if (typeof raw === 'string' && raw.trim()) return new Set(raw.split(',').map(v => v.trim()).filter(Boolean));
    return new Set();
}

export async function setOffPage(app: App, projectFilePath: string | undefined | null, line: string, off: boolean): Promise<void> {
    if (!projectFilePath) return;
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        const current = Array.isArray(fm[OFF_PAGE_KEY]) ? (fm[OFF_PAGE_KEY] as unknown[]).map(String) : [];
        const next = off ? Array.from(new Set([...current, line])) : current.filter(l => l !== line);
        if (next.length) fm[OFF_PAGE_KEY] = next; else delete fm[OFF_PAGE_KEY];
    });
}

/**
 * On-page lines first, then off-page lines (each group keeps the current
 * sort order). `split` is the index of the first off-page lane, or -1 if
 * there is none.
 */
export function orderByZone(keys: string[], offPage: Set<string>): { keys: string[]; split: number } {
    if (offPage.size === 0) return { keys, split: -1 };
    const on = keys.filter(k => !offPage.has(k));
    const off = keys.filter(k => offPage.has(k));
    return { keys: [...on, ...off], split: off.length ? on.length : -1 };
}

/** Tinted background band behind the off-page lanes (styled via .sl-km-offpage-band). */
export function drawOffPageBand(svg: SVGSVGElement, doc: Document, y: number, height: number, width: number): void {
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.classList.add('sl-km-offpage-band');
    svg.insertBefore(rect, svg.firstChild);
}

/** Same tint behind the line names in the sticky name column. */
export function renderOffPageLabelBand(labelCol: HTMLElement, top: number, height: number): void {
    const band = labelCol.createDiv('sl-km-offpage-band-label');
    band.setCssStyles({ position: 'absolute', left: '0', right: '0', top: `${top}px`, height: `${height}px` });
}

/** "ON PAGE" / "OFF PAGE" header in the sticky line-name column. */
export function renderZoneHeader(labelCol: HTMLElement, text: string, top: number, left: number, off: boolean): void {
    const el = labelCol.createDiv({ cls: `sl-km-zone-header${off ? ' is-off-page' : ''}`, text });
    el.setCssStyles({ position: 'absolute', top: `${top}px`, left: `${left}px` });
}

/** Right-click on a line name: move it between the zones. */
export function attachZoneMenu(
    el: HTMLElement,
    app: App,
    projectFilePath: string | undefined | null,
    line: string,
    isOff: boolean,
    onChanged: () => void,
): void {
    el.setCssStyles({ pointerEvents: 'auto' });
    el.addEventListener('contextmenu', (evt: MouseEvent) => {
        evt.preventDefault();
        const menu = new Menu();
        menu.addItem(item => item
            .setTitle(isOff ? 'Move to on page' : 'Move to off page')
            .setIcon(isOff ? 'file-text' : 'cloud')
            .onClick(async () => {
                await setOffPage(app, projectFilePath, line, !isOff);
                window.setTimeout(onChanged, 150);
            }));
        menu.showAtMouseEvent(evt);
    });
}

/** "ON PAGE" / "OFF PAGE" heading between plotline sections (Plotlines list view). */
export function renderZoneListHeading(parent: HTMLElement, off: boolean): void {
    parent.createDiv({ cls: `sl-km-zone-list-heading${off ? ' is-off-page' : ''}`, text: off ? 'OFF PAGE' : 'ON PAGE' });
}
