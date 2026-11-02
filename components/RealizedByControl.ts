/**
 * Inspector control for the Arc Point "realized by" link:
 * `☑ Arc point   Realized [not yet ▾]` in the Arc point row.
 */
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { compareScenesByActChapter } from '../utils/actChapter';
import { readRealizedBy, realizedByLinkpath, resolveRealizingScene, writeRealizedBy } from '../utils/arcRealization';

/** Option value for a hand-typed link that does not resolve to a scene. */
const UNRESOLVED_VALUE = '__unresolved__';

/**
 * Renders the "Realized" dropdown into the Arc point row (`container`).
 * It is only shown while the Arc point checkbox is ticked.
 * `getScenes` returns the candidate scenes of the project.
 */
export function renderRealizedByControl(
    container: HTMLElement,
    app: App,
    scene: Scene,
    getScenes: () => Scene[],
): void {
    const row = container.createDiv('inspector-realized-by');
    const isArc = () => {
        const cb = container.querySelector<HTMLInputElement>('#arc-anchor-toggle');
        return cb ? cb.checked : !!scene.arcAnchor;
    };
    const render = () => {
        row.empty();
        if (!isArc()) { row.hide(); return; }
        row.show();
        row.createSpan({ cls: 'inspector-realized-by-label', text: 'Realized' });

        const raw = readRealizedBy(app, scene);
        const candidates = getScenes()
            .filter(s => !s.arcAnchor && !s.corkboardNote && s.filePath !== scene.filePath)
            .sort((a, b) => compareScenesByActChapter(a, b, (x, y) => (x.sequence ?? 0) - (y.sequence ?? 0)));
        const current = raw ? resolveRealizingScene(app, scene, candidates) : undefined;

        const select = row.createEl('select', { cls: 'dropdown inspector-realized-by-select' });
        // eslint-disable-next-line obsidianmd/ui/sentence-case -- reads as "Realized: not yet" after the label
        select.createEl('option', { text: 'not yet', value: '' });
        for (const c of candidates) {
            const label = `${c.act !== undefined ? `${c.act}-` : ''}${c.sequence ?? ''} ${c.title || c.filePath}`.trim();
            select.createEl('option', { text: label, value: c.filePath });
        }
        // A link typed by hand that does not resolve stays visible instead of showing "not yet"
        if (raw && !current) {
            select.createEl('option', { text: `${realizedByLinkpath(raw)} (not found)`, value: UNRESOLVED_VALUE });
        }
        select.value = current ? current.filePath : (raw ? UNRESOLVED_VALUE : '');
        select.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation());
        select.addEventListener('change', () => {
            if (select.value === UNRESOLVED_VALUE) return;
            const target = candidates.find(c => c.filePath === select.value);
            void writeRealizedBy(app, scene, target);
        });
    };
    render();
    // Show / hide together with the Arc point checkbox in the same row
    container.querySelector('#arc-anchor-toggle')?.addEventListener('change', () => window.setTimeout(render, 0));
}
