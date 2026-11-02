// ═══════════════════════════════════════════════════════
//  On page / off page plotlines
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
// (lowercase, spaces become dashes), so `[Mark, Politics]`,
// `[mark, politics]` and `offPageLines: mark, politics` all mark the
// plotlines `Mark` / `mark` and `Politics` / `politics`. The list is only
// rewritten (normalized) when a line is moved, renamed or deleted.
//
// Without `offPageLines` nothing changes in any view.

import { Menu, TFile } from 'obsidian';
import type { App } from 'obsidian';

const OFF_PAGE_KEY = 'offPageLines';

/** Vertical space added above the off page band in the Subway map (room for its header). */
export const ZONE_GAP = 44;

/** The plotline tag rule used when a plotline is created or renamed. */
export function normalizePlotlineTag(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Reads a YAML list or a comma separated string. */
function parseOffPageValue(raw: unknown): string[] {
    const items: unknown[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
    const out = items
        .filter(v => typeof v === 'string' || typeof v === 'number')
        .map(v => normalizePlotlineTag(String(v)))
        .filter(Boolean);
    return Array.from(new Set(out));
}

/** Normalized tags of all off page plotlines of the project (empty set if none). */
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

/** Mark `line` off page (`off` true) or on page again. */
export async function setOffPage(app: App, projectFilePath: string | undefined | null, line: string, off: boolean): Promise<void> {
    const tag = normalizePlotlineTag(line);
    if (!tag) return;
    await updateOffPage(app, projectFilePath, current =>
        off ? Array.from(new Set([...current, tag])) : current.filter(l => l !== tag));
}

/**
 * Keeps `offPageLines` in step when a plotline is renamed (`newTag` set)
 * or deleted (`newTag` null). Does not touch the project file for
 * plotlines that are not off page.
 */
export async function transferOffPage(app: App, projectFilePath: string | undefined | null, oldTag: string, newTag: string | null): Promise<void> {
    if (!isOffPage(getOffPageLines(app, projectFilePath), oldTag)) return;
    const from = normalizePlotlineTag(oldTag);
    const to = newTag ? normalizePlotlineTag(newTag) : '';
    await updateOffPage(app, projectFilePath, current => {
        if (!current.includes(from)) return current;
        const next = current.filter(l => l !== from);
        return to && !next.includes(to) ? [...next, to] : next;
    });
}

/**
 * On page lines first, then off page lines (each group keeps its order).
 * `split` is the index of the first off page line, or -1 if there is none.
 */
export function orderByZone(keys: string[], offPage: Set<string>): { keys: string[]; split: number } {
    if (offPage.size === 0) return { keys, split: -1 };
    const on = keys.filter(k => !isOffPage(offPage, k));
    const off = keys.filter(k => isOffPage(offPage, k));
    return { keys: [...on, ...off], split: off.length ? on.length : -1 };
}

/** Tinted background band behind the off page lanes of the Subway map. */
export function drawOffPageBand(svg: SVGSVGElement, doc: Document, y: number, height: number, width: number): void {
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.classList.add('subway-offpage-band');
    svg.insertBefore(rect, svg.firstChild);
}

/** Same tint behind the line names in the sticky name column. */
export function renderOffPageLabelBand(labelCol: HTMLElement, top: number, height: number): void {
    const band = labelCol.createDiv('subway-offpage-band-label');
    band.setCssStyles({ position: 'absolute', left: '0', right: '0', top: `${top}px`, height: `${height}px` });
}

/** "On page" / "Off page" header in the sticky line name column. */
export function renderZoneHeader(labelCol: HTMLElement, top: number, left: number, off: boolean): void {
    const el = labelCol.createDiv({ cls: `subway-zone-header${off ? ' is-off-page' : ''}`, text: off ? 'Off page' : 'On page' });
    el.setCssStyles({ position: 'absolute', top: `${top}px`, left: `${left}px` });
}

/** "On page" / "Off page" heading between plotline sections (Plotlines list view). */
export function renderZoneListHeading(parent: HTMLElement, off: boolean): void {
    parent.createDiv({ cls: `storyline-zone-heading${off ? ' is-off-page' : ''}`, text: off ? 'Off page' : 'On page' });
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
    if (!projectFilePath) return;
    menu.addItem(item => item
        .setTitle(isOff ? 'Move to on page' : 'Move to off page')
        .setIcon(isOff ? 'file-text' : 'cloud')
        .onClick(async () => {
            await setOffPage(app, projectFilePath, line, !isOff);
            // Give the metadata cache time to pick up the frontmatter change
            window.setTimeout(onChanged, 150);
        }));
}

/** Right-click on a Subway line name: move it between the zones. */
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
