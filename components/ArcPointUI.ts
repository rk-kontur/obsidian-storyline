// ═══════════════════════════════════════════════════════
//  Arc Point UI helpers (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Shared building blocks so views that did not know about Arc Points yet
// (Timeline, Plotgrid) can show them with the same look and filter as
// Board and Subway. Reuses the existing CSS classes
// `story-line-arc-filter*` and `scene-card-arc-point-badge`.

import * as obsidian from 'obsidian';
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';

export type ArcFilterMode = 'all' | 'scenes' | 'arcPoints';

const ARC_MODES: { value: ArcFilterMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'scenes', label: 'Scenes' },
    { value: 'arcPoints', label: 'Arc Points' },
];

/** Three-way Arc Point filter toggle, same markup as the Subway view. */
export function renderArcFilterToggle(
    parent: HTMLElement,
    current: ArcFilterMode,
    onChange: (mode: ArcFilterMode) => void,
): HTMLElement {
    const container = parent.createDiv('story-line-arc-filter');
    for (const mode of ARC_MODES) {
        const btn = container.createEl('button', {
            cls: `story-line-arc-filter-btn${current === mode.value ? ' is-active' : ''}`,
            text: mode.label,
        });
        btn.addEventListener('click', () => {
            container.querySelectorAll('.story-line-arc-filter-btn').forEach(b => b.removeClass('is-active'));
            btn.addClass('is-active');
            onChange(mode.value);
        });
    }
    return container;
}

/** Filter object for SceneQueryService.getFilteredScenes, undefined for 'all'. */
export function arcFilterQuery(mode: ArcFilterMode): { arcAnchorFilter: ArcFilterMode } | undefined {
    return mode === 'all' ? undefined : { arcAnchorFilter: mode };
}

/** "◆ Arc Point" badge as used on Board cards. No-op for regular scenes. */
export function renderArcPointBadge(parent: HTMLElement, scene: Scene): void {
    if (!scene.arcAnchor) return;
    const badge = parent.createDiv({ cls: 'scene-card-arc-point-badge' });
    const icon = badge.createSpan();
    obsidian.setIcon(icon, 'diamond');
    badge.createSpan({ text: ' Arc Point' });
}

/** Small inline diamond icon (for compact places like grid cells and headers). */
export function renderArcPointIcon(parent: HTMLElement, scene: Scene | undefined): void {
    if (!scene?.arcAnchor) return;
    const icon = parent.createSpan({ cls: 'sl-km-arc-point-icon' });
    obsidian.setIcon(icon, 'diamond');
    icon.title = 'Arc Point';
    icon.setCssStyles({ display: 'inline-flex', marginLeft: '4px', opacity: '0.8' });
    const svg = icon.querySelector('svg');
    if (svg) { svg.setAttribute('width', '12'); svg.setAttribute('height', '12'); }
}

// Persist small per-view UI choices in vault-local storage instead of
// plugin settings, to keep settings.ts free of fork changes.
const STORAGE_PREFIX = 'storyline-km:';

export function loadArcFilter(app: App, key: string): ArcFilterMode {
    const v: unknown = app.loadLocalStorage(STORAGE_PREFIX + key);
    return v === 'scenes' || v === 'arcPoints' ? v : 'all';
}

export function saveArcFilter(app: App, key: string, mode: ArcFilterMode): void {
    app.saveLocalStorage(STORAGE_PREFIX + key, mode);
}
