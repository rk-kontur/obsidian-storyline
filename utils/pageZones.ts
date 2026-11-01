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
//   offPageLines: [mark, politics]
//
// Entries and scene tags are compared after the plotline tag rule
// (lowercase, spaces become dashes; isOffPage), so `[Mark, Politics]`,
// `[mark, politics]` and `offPageLines: mark, politics` all mark the
// plotlines `Mark` / `mark` and `Politics` / `politics`. The list is written
// back normalized on the next change. Renaming or deleting a plotline updates
// it (transferOffPage).
//
// The Subway map shows on-page lines first and the off-page lines below in
// their own tinted band. Without `offPageLines` nothing changes.

import { Menu, TFile } from 'obsidian';
import type { App } from 'obsidian';

export const OFF_PAGE_KEY = 'offPageLines';

/** Vertical space added above the off-page band (room for its header). */
export const ZONE_GAP = 44;

/** Upstream's plotline tag rule (StorylineView rename / new plotline). */
export function normalizePlotlineTag(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Shared parser for read and write: a YAML list or a comma separated string. */
export function parseOffPageValue(raw: unknown): string[] {
    const items: unknown[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
    const out = items
        .filter(v => typeof v === 'string' || typeof v === 'number')
        .map(v => normalizePlotlineTag(String(v)))
        .filter(Boolean);
    return Array.from(new Set(out));
}

export function getOffPageLines(app: App, projectFilePath: string | undefined | null): Set<string> {
    if (!projectFilePath) return new Set();
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return new Set();
    return new Set(parseOffPageValue(app.metadataCache.getFileCache(file)?.frontmatter?.[OFF_PAGE_KEY]));
}

/** Is `tag` (a raw scene tag / plotline key) marked off page? */
export function isOffPage(offPage: Set<string>, tag: string): boolean {
    return offPage.size > 0 && offPage.has(normalizePlotlineTag(tag));
}

/** Pure update of the list: mark `line` off page (or on page again). */
export function withOffPage(current: string[], line: string, off: boolean): string[] {
    const tag = normalizePlotlineTag(line);
    if (!tag) return current;
    return off ? Array.from(new Set([...current, tag])) : current.filter(l => l !== tag);
}

/**
 * Pure update for a rename (`newTag` set) or delete (`newTag` null): the old
 * entry is removed; on rename an off page status moves to the new tag.
 */
export function withTransferredOffPage(current: string[], oldTag: string, newTag: string | null): string[] {
    const from = normalizePlotlineTag(oldTag);
    if (!current.includes(from)) return current;
    const next = current.filter(l => l !== from);
    const to = newTag ? normalizePlotlineTag(newTag) : '';
    return to && !next.includes(to) ? [...next, to] : next;
}

async function updateOffPage(app: App, projectFilePath: string | undefined | null, update: (current: string[]) => string[]): Promise<void> {
    if (!projectFilePath) return;
    const file = app.vault.getAbstractFileByPath(projectFilePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        const current = parseOffPageValue(fm[OFF_PAGE_KEY]);
        const next = update(current);
        // Nothing changed: leave the value as written by hand
        if (next.length === current.length && next.every((l, i) => l === current[i])) return;
        if (next.length) fm[OFF_PAGE_KEY] = next; else delete fm[OFF_PAGE_KEY];
    });
}

export async function setOffPage(app: App, projectFilePath: string | undefined | null, line: string, off: boolean): Promise<void> {
    await updateOffPage(app, projectFilePath, current => withOffPage(current, line, off));
}

/** Hook for renaming (`newTag`) or deleting (`newTag` null) a plotline. */
export async function transferOffPage(app: App, projectFilePath: string | undefined | null, oldTag: string, newTag: string | null): Promise<void> {
    // Cheap pre-check: never touch the project file for plotlines that are not off page
    if (!isOffPage(getOffPageLines(app, projectFilePath), oldTag)) return;
    await updateOffPage(app, projectFilePath, current => withTransferredOffPage(current, oldTag, newTag));
}

/**
 * On-page lines first, then off-page lines (each group keeps the current
 * sort order). `split` is the index of the first off-page lane, or -1 if
 * there is none.
 */
export function orderByZone(keys: string[], offPage: Set<string>): { keys: string[]; split: number } {
    if (offPage.size === 0) return { keys, split: -1 };
    const on = keys.filter(k => !isOffPage(offPage, k));
    const off = keys.filter(k => isOffPage(offPage, k));
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

/** "Move to off page" / "Move to on page" entry for an existing menu. */
export function addZoneMenuItem(
    menu: Menu,
    app: App,
    projectFilePath: string | undefined | null,
    line: string,
    onChanged: () => void,
    isOff: boolean = isOffPage(getOffPageLines(app, projectFilePath), line),
): void {
    menu.addItem(item => item
        .setTitle(isOff ? 'Move to on page' : 'Move to off page')
        .setIcon(isOff ? 'file-text' : 'cloud')
        .onClick(async () => {
            await setOffPage(app, projectFilePath, line, !isOff);
            // Give the metadata cache time to pick up the frontmatter change
            window.setTimeout(onChanged, 150);
        }));
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
        addZoneMenuItem(menu, app, projectFilePath, line, onChanged, isOff);
        menu.showAtMouseEvent(evt);
    });
}

/** "ON PAGE" / "OFF PAGE" heading between plotline sections (Plotlines list view). */
export function renderZoneListHeading(parent: HTMLElement, off: boolean): void {
    parent.createDiv({ cls: `sl-km-zone-list-heading${off ? ' is-off-page' : ''}`, text: off ? 'OFF PAGE' : 'ON PAGE' });
}
