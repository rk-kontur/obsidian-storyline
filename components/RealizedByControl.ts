// ═══════════════════════════════════════════════════════
//  Inspector control for Arc Point "realizedBy" (fork: storyline-km)
// ═══════════════════════════════════════════════════════

import { FuzzySuggestModal, TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { linkpathOf, readRealizedBy, REALIZED_BY_KEY } from '../utils/arcRealization';

class ScenePickerModal extends FuzzySuggestModal<Scene> {
    constructor(app: App, private scenes: Scene[], private onPick: (scene: Scene) => void) {
        super(app);
        this.setPlaceholder('Scene that realizes this Arc Point…');
    }
    getItems(): Scene[] { return this.scenes; }
    getItemText(scene: Scene): string {
        const act = scene.act !== undefined ? `${scene.act}-` : '';
        return `${act}${scene.sequence ?? ''} ${scene.title || scene.filePath}`.trim();
    }
    onChooseItem(scene: Scene): void { this.onPick(scene); }
}

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
 * Renders "Realized by: <scene> [Choose] [×]" for Arc Points.
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
        row.createSpan({ cls: 'sl-km-realized-by-label', text: 'Realized by' });
        const raw = readRealizedBy(app, scene);
        row.createSpan({
            cls: raw ? 'sl-km-realized-by-value' : 'sl-km-realized-by-value sl-km-muted',
            text: raw ? linkpathOf(raw) : 'not yet',
        });
        const choose = row.createEl('button', { text: raw ? 'Change' : 'Choose…' });
        choose.addEventListener('click', () => {
            const candidates = getScenes().filter(s => !s.arcAnchor && s.filePath !== scene.filePath);
            new ScenePickerModal(app, candidates, async (target) => {
                await writeRealizedBy(app, scene, target);
                window.setTimeout(() => { render(); onChanged?.(); }, 150);
            }).open();
        });
        if (raw) {
            const clear = row.createEl('button', { text: '×', attr: { 'aria-label': 'Remove link' } });
            clear.addEventListener('click', async () => {
                await writeRealizedBy(app, scene, undefined);
                window.setTimeout(() => { render(); onChanged?.(); }, 150);
            });
        }
    };
    render();
    // Re-render when the Arc Point checkbox right above changes.
    container.querySelector('#arc-anchor-toggle')?.addEventListener('change', () => window.setTimeout(render, 0));
}
