import * as obsidian from 'obsidian';
import type { Scene, SceneFilter } from '../models/Scene';

/**
 * Arc Point UI helpers for the views that did not show Arc Points yet
 * (Timeline, Plot Grid). Same markup and CSS classes as the Board and
 * Subway views.
 */

export type ArcFilterMode = 'all' | 'scenes' | 'arcPoints';

const ARC_MODES: { value: ArcFilterMode; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'scenes', label: 'Scenes' },
    { value: 'arcPoints', label: 'Arc Points' },
];

/** All / Scenes / Arc Points toggle, same markup as in the Plotlines view. */
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

/** Scene filter for SceneQueryService.getFilteredScenes; undefined (no filter) for 'all'. */
export function arcFilterQuery(mode: ArcFilterMode): SceneFilter | undefined {
    return mode === 'all' ? undefined : { arcAnchorFilter: mode };
}

/** "Arc Point" badge as on Board cards. Does nothing for regular scenes. */
export function renderArcPointBadge(parent: HTMLElement, scene: Scene): void {
    if (!scene.arcAnchor) return;
    const badge = parent.createDiv({ cls: 'scene-card-arc-point-badge' });
    const icon = badge.createSpan();
    obsidian.setIcon(icon, 'diamond');
    badge.createSpan({ text: ' Arc Point' });
}

/** Small diamond icon for compact places (Plot Grid cells and row headers). */
export function renderArcPointIcon(parent: HTMLElement, scene: Scene | undefined): void {
    if (!scene?.arcAnchor) return;
    const icon = parent.createSpan({ cls: 'story-line-arc-point-icon' });
    obsidian.setIcon(icon, 'diamond');
    // eslint-disable-next-line obsidianmd/ui/sentence-case -- "Arc Point" is the feature's name, spelled as in the other views
    icon.title = 'Arc Point';
}
