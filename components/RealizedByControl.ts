// ═══════════════════════════════════════════════════════
//  Inspector control for Arc Point "realizedBy" (fork: storyline-km)
// ═══════════════════════════════════════════════════════

import { TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { linkpathOf, readRealizedBy, REALIZED_BY_KEY, resolveRealizingScene } from '../utils/arcRealization';

async function writeRealizedBy(app: App, arc: Scene, target: Scene | undefined): Promise<void> {
    const file = app.vault.getAbstractFileByPath(arc.filePath);
    if (!(file instanceof TFile)) return;
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        delete fm.realized_by;
        if (!target) { delete fm[REALIZED_BY_KEY]; return; }
        const targetFile = app.vault.getAbstractFileByPath(target.filePath);
        const linktext = targetFile instanceof TFile
            ? app.metadataCache.fileToLinktext(targetFile, arc.filePath, true)
            : (target.title || '');
        fm[REALIZED_BY_KEY] = `[[${linktext}]]`;
    });
}

/**
 * Renders "realized by [dropdown: not yet | scenes…]" in one line for Arc Points.
 * `getScenes` returns the candidate scenes (regular scenes of the project).
 */
export function renderRealizedByControl(
    container: HTMLElement,
    app: App,
    scene: Scene,
    getScenes: () => Scene[],
    onChanged?: () => void,
): void {
    const row = container.createDiv('inspector-section sl-km-realized-by');
    const isArc = () => {
        const cb = container.querySelector<HTMLInputElement>('#arc-anchor-toggle');
        return cb ? cb.checked : !!scene.arcAnchor;
    };
    const render = () => {
        row.empty();
        if (!isArc()) { row.hide(); return; }
        row.show();
        row.createSpan({ cls: 'sl-km-realized-by-label', text: 'realized by' });

        const raw = readRealizedBy(app, scene);
        const candidates = getScenes()
            .filter(s => !s.arcAnchor && !s.corkboardNote && s.filePath !== scene.filePath)
            .sort((a, b) => (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0));
        const current = raw ? resolveRealizingScene(app, scene, candidates) : undefined;

        const select = row.createEl('select', { cls: 'dropdown sl-km-realized-by-select' });
        select.createEl('option', { text: 'not yet', value: '' });
        for (const c of candidates) {
            const label = `${c.act !== undefined ? `${c.act}-` : ''}${c.sequence ?? ''} ${c.title || c.filePath}`.trim();
            select.createEl('option', { text: label, value: c.filePath });
        }
        // Link set by hand that does not resolve: keep it visible instead of silently showing "not yet"
        if (raw && !current) {
            select.createEl('option', { text: `${linkpathOf(raw)} (not found)`, value: '__raw__' });
        }
        select.value = current ? current.filePath : (raw ? '__raw__' : '');
        select.addEventListener('keydown', (e: KeyboardEvent) => e.stopPropagation());
        select.addEventListener('change', async () => {
            if (select.value === '__raw__') return;
            const target = candidates.find(c => c.filePath === select.value);
            await writeRealizedBy(app, scene, target);
            onChanged?.();
        });
    };
    render();
    // Re-render when the Arc Point checkbox right above changes.
    container.querySelector('#arc-anchor-toggle')?.addEventListener('change', () => window.setTimeout(render, 0));
}
