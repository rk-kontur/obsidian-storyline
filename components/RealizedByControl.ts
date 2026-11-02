// ═══════════════════════════════════════════════════════
//  Inspector control for Arc Point "realizedBy" (fork: storyline-km)
// ═══════════════════════════════════════════════════════

import { TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { readRealizedBy, REALIZED_BY_KEY, resolveRealizingScene } from '../utils/arcRealization';
import { linkpathOf } from '../utils/linkKey';

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
 * Removes `realizedBy` (and the `realized_by` spelling) from a scene that is
 * no longer an Arc Point, so no orphaned link stays behind. Call after the
 * `arcAnchor` write has finished; does nothing when neither key is set.
 */
export async function clearRealizedBy(app: App, scene: Scene): Promise<void> {
    const file = app.vault.getAbstractFileByPath(scene.filePath);
    if (!(file instanceof TFile)) return;
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    if (fm && !(REALIZED_BY_KEY in fm) && !('realized_by' in fm)) return;
    await app.fileManager.processFrontMatter(file, (front: Record<string, unknown>) => {
        delete front[REALIZED_BY_KEY];
        delete front.realized_by;
    });
}

/**
 * Renders "Realized [dropdown: not yet | scenes…]" next to the Arc point checkbox.
 * `container` is the Arc point row of the Inspector.
 * `getScenes` returns the candidate scenes (regular scenes of the project).
 */
export function renderRealizedByControl(
    container: HTMLElement,
    app: App,
    scene: Scene,
    getScenes: () => Scene[],
    onChanged?: () => void,
): void {
    const row = container.createDiv('sl-km-realized-by');
    const isArc = () => {
        const cb = container.querySelector<HTMLInputElement>('#arc-anchor-toggle');
        return cb ? cb.checked : !!scene.arcAnchor;
    };
    const render = () => {
        row.empty();
        if (!isArc()) { row.hide(); return; }
        row.show();
        row.createSpan({ cls: 'sl-km-realized-by-label', text: 'Realized' });

        const raw = readRealizedBy(app, scene);
        const candidates = getScenes()
            .filter(s => !s.arcAnchor && !s.corkboardNote && s.filePath !== scene.filePath)
            .sort((a, b) => (Number(a.act) || 0) - (Number(b.act) || 0) || (a.sequence ?? 0) - (b.sequence ?? 0));
        const current = raw ? resolveRealizingScene(app, scene, candidates) : undefined;

        const select = row.createEl('select', { cls: 'dropdown sl-km-realized-by-select' });
        // eslint-disable-next-line obsidianmd/ui/sentence-case -- reads as "Realized: not yet" after the label
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
        select.addEventListener('change', () => {
            if (select.value === '__raw__') return;
            const target = candidates.find(c => c.filePath === select.value);
            void writeRealizedBy(app, scene, target).then(() => onChanged?.());
        });
    };
    render();
    // Re-render when the Arc Point checkbox right above changes.
    container.querySelector('#arc-anchor-toggle')?.addEventListener('change', () => window.setTimeout(render, 0));
}
