// Volume bands: where a volume starts (and ends) in views that list acts in
// order (Timeline, Board, Manuscript, Plot Grid, Subway map, Navigator).
// Also the "V2" volume badge on scene cards. Without volumes nothing is
// rendered.

import { TFile, type App } from 'obsidian';
import type SceneCardsPlugin from '../main';
import type { Scene } from '../models/Scene';
import { getProjectVolumes, getVolumeForAct, type VolumeDef } from './volumes';

/**
 * Tracks the current volume while a view renders its act dividers in order,
 * and reports where a volume band starts or ends.
 */
export class VolumeDividerTracker {
    private lastId: string | null = null;

    /**
     * `opts.bandEnd`: an act outside every volume (Prologue, Epilogue,
     * "No Act", non-numeric or unassigned acts) after a volume ends the band
     * with an unlabelled separator, so it is not drawn inside the last
     * volume's band. A later volume act starts its band again.
     */
    constructor(private volumes: VolumeDef[], private opts: { bandEnd?: boolean } = {}) {}

    get active(): boolean {
        return this.volumes.length > 0;
    }

    /**
     * The volume if `act` starts a new volume; with `bandEnd`, 'end' when an
     * act outside every volume follows a volume; else undefined.
     */
    advance(act: number | string | undefined): VolumeDef | 'end' | undefined {
        if (!this.active) return undefined;
        const vol = getVolumeForAct(this.volumes, act);
        if (!vol) {
            if (this.opts.bandEnd && this.lastId !== null) {
                this.lastId = null;
                return 'end';
            }
            return undefined;
        }
        if (vol.id === this.lastId) return undefined;
        this.lastId = vol.id;
        return vol;
    }

    /** Render the band (or band end) before an act divider if one starts there; returns it. */
    renderBefore(parent: HTMLElement, act: number | string | undefined, gridColumn?: string): HTMLElement | undefined {
        const step = this.advance(act);
        return step ? renderVolumeStep(parent, step, gridColumn) : undefined;
    }

    /** Board columns: a vertical band before an act column where a volume starts (or ends). */
    renderColumnBefore(parent: HTMLElement, act: number | string | undefined): void {
        const step = this.advance(act);
        if (step === 'end') {
            parent.createDiv('story-line-volume-column story-line-volume-end');
        } else if (step) {
            const band = parent.createDiv('story-line-volume-column');
            band.setAttribute('title', step.title);
            band.createSpan({ cls: 'story-line-volume-column-label', text: step.title });
        }
    }

    /**
     * Render the band of a given volume (e.g. a volume without scenes, which
     * has no act divider) unless it is the current one; returns the band.
     */
    renderVolume(parent: HTMLElement, vol: VolumeDef, gridColumn?: string): HTMLElement | undefined {
        if (!this.active || vol.id === this.lastId) return undefined;
        this.lastId = vol.id;
        return renderVolumeStep(parent, vol, gridColumn);
    }
}

/** Render a labelled volume band, or (for 'end') the unlabelled band end. */
export function renderVolumeStep(parent: HTMLElement, step: VolumeDef | 'end', gridColumn?: string): HTMLElement {
    const band = parent.createDiv(step === 'end' ? 'story-line-volume-divider story-line-volume-end' : 'story-line-volume-divider');
    if (gridColumn) band.setCssStyles({ gridColumn });
    if (step !== 'end') band.createSpan({ cls: 'story-line-volume-divider-label', text: step.title });
    return band;
}

// ── Plotlines (Subway map) ──────────────────────────

/** Solid vertical line between act columns where a volume starts or its band ends. */
export function drawSubwayVolumeMarker(svg: SVGSVGElement, doc: Document, opts: { x: number; y1: number; y2: number }): void {
    const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(opts.x));
    line.setAttribute('y1', String(opts.y1));
    line.setAttribute('x2', String(opts.x));
    line.setAttribute('y2', String(opts.y2));
    line.setAttribute('stroke', 'var(--text-muted)');
    line.setAttribute('stroke-width', '4');
    svg.appendChild(line);
}

/** Rough width of bold upper-case text, when the SVG cannot measure (not rendered yet). */
function estimateTextWidth(text: string, fontSize: number): number {
    return text.length * fontSize * 0.68;
}

function textWidth(el: SVGTextContentElement, text: string, fontSize: number): number {
    let measured = 0;
    try { measured = el.getComputedTextLength(); } catch { measured = 0; }
    return measured > 0 ? measured : estimateTextWidth(text, fontSize);
}

/** Set `el`'s text, shortened with "…" until it fits `maxWidth` (binary search). Returns true if shortened. */
function setFittedText(el: SVGTextContentElement, text: string, maxWidth: number, fontSize: number): boolean {
    el.textContent = text;
    if (textWidth(el, text, fontSize) <= maxWidth) return false;
    const cut = (n: number) => text.slice(0, n).trimEnd() + '…';
    let lo = 1;
    let hi = text.length - 1;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        el.textContent = cut(mid);
        if (textWidth(el, cut(mid), fontSize) <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    el.textContent = cut(lo);
    return true;
}

/**
 * Act label with the volume title, e.g. "VOLUME 1 ACT 1". If it is wider than
 * the act's columns, the volume title moves onto its own line above; a line
 * that still does not fit is shortened with "…" and the full label becomes
 * the tooltip. Acts outside every volume keep the plain act label.
 */
export function setSubwayActLabel(
    label: SVGTextElement,
    doc: Document,
    opts: { volumeTitle?: string; actLabel: string; maxWidth: number; fontSize: number; lineHeight: number },
): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    const act = opts.actLabel.toUpperCase();
    const vol = (opts.volumeTitle ?? '').toUpperCase();
    if (!vol) {
        label.textContent = act;
        return;
    }
    const full = `${vol} ${act}`;
    label.textContent = full;
    if (textWidth(label, full, opts.fontSize) <= opts.maxWidth) return;
    label.textContent = '';
    const x = label.getAttribute('x') ?? '0';
    const volLine = doc.createElementNS(svgNS, 'tspan');
    volLine.setAttribute('x', x);
    volLine.setAttribute('dy', String(-opts.lineHeight));
    label.appendChild(volLine);
    const actLine = doc.createElementNS(svgNS, 'tspan');
    actLine.setAttribute('x', x);
    actLine.setAttribute('dy', String(opts.lineHeight));
    label.appendChild(actLine);
    let shortened = setFittedText(volLine, vol, opts.maxWidth, opts.fontSize);
    shortened = setFittedText(actLine, act, opts.maxWidth, opts.fontSize) || shortened;
    if (shortened) {
        const title = doc.createElementNS(svgNS, 'title');
        title.textContent = full;
        label.appendChild(title);
    }
}

// ── Scene card badge ────────────────────────────────

/**
 * Parsed volumes per frontmatter object of the project file: the metadata
 * cache hands out the same object until the file changes, so the volumes
 * are parsed once per change, not once per card.
 */
const volumesByFrontmatter = new WeakMap<object, VolumeDef[]>();

function cardVolumes(app: App, projectFilePath: string | undefined): VolumeDef[] {
    const file = projectFilePath ? app.vault.getAbstractFileByPath(projectFilePath) : null;
    const fm = file instanceof TFile ? app.metadataCache.getFileCache(file)?.frontmatter : undefined;
    if (!fm) return [];
    let volumes = volumesByFrontmatter.get(fm);
    if (!volumes) {
        volumes = getProjectVolumes(app, projectFilePath);
        volumesByFrontmatter.set(fm, volumes);
    }
    return volumes;
}

/** Short volume badge text, e.g. "V2", from the title's number if it ends in one. */
function volumeBadgeText(volumes: VolumeDef[], vol: VolumeDef): string {
    const num = vol.title.match(/(\d+)\s*$/)?.[1];
    return num ? `V${num}` : `V${volumes.indexOf(vol) + 1}`;
}

/** Small "V2" badge in a scene card header. Renders nothing without volumes. */
export function renderVolumeBadge(parent: HTMLElement, plugin: SceneCardsPlugin, scene: Scene): void {
    if (scene.act === undefined) return;
    const volumes = cardVolumes(plugin.app, plugin.sceneManager.activeProject?.filePath);
    if (volumes.length === 0) return;
    const vol = getVolumeForAct(volumes, scene.act);
    if (!vol) return;
    parent.createSpan({ cls: 'story-line-volume-badge', text: volumeBadgeText(volumes, vol), attr: { title: vol.title } });
}
