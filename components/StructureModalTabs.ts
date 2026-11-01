// ═══════════════════════════════════════════════════════
//  "Manage story structure" as tabs (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The dialog is built by BoardView / TimelineView exactly as upstream does.
// Right before it opens, this module regroups its content at the existing
// <h3> headings into tabs and adds a "Volumes" tab:
//
//   Volumes | Acts | Chapters | Templates
//
// Templates holds the beat sheet sections as collapsible blocks. If the
// expected headings are not found (upstream changed the dialog), the dialog
// is left as it is.

import type { App, Modal } from 'obsidian';
import { renderVolumesEditor } from './VolumesEditor';

export type StructureTab = 'volumes' | 'acts' | 'chapters' | 'templates';

const TABS: { id: StructureTab; label: string }[] = [
    { id: 'volumes', label: 'Volumes' },
    { id: 'acts', label: 'Acts' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'templates', label: 'Templates' },
];

const STORAGE_KEY = 'storyline-km:structureTab';

function tabForHeading(text: string): StructureTab {
    const t = text.trim().toLowerCase();
    if (t === 'acts') return 'acts';
    if (t === 'chapters') return 'chapters';
    return 'templates';
}

export function setNextStructureTab(app: App, tab: StructureTab): void {
    app.saveLocalStorage(STORAGE_KEY, tab);
}

export interface StructureModalContext {
    app: App;
    projectFilePath: string | undefined;
    definedActs: number[];
}

export function tabifyStructureModal(modal: Modal, ctx: StructureModalContext): void {
    const content = modal.contentEl;
    const children = Array.from(content.children) as HTMLElement[];
    const headings = children.filter(el => el.tagName === 'H3');
    const names = headings.map(h => (h.textContent || '').trim().toLowerCase());
    if (!names.includes('acts') || !names.includes('chapters')) return; // unknown layout: leave untouched

    // Group nodes into sections at each <h3>; footer (Done button) stays outside the tabs.
    const footer = children.find(el => el.classList.contains('structure-close-row'));
    const preamble: HTMLElement[] = [];
    const sections: { tab: StructureTab; heading: HTMLElement; nodes: HTMLElement[] }[] = [];
    for (const el of children) {
        if (el === footer) continue;
        if (el.tagName === 'H3') {
            sections.push({ tab: tabForHeading(el.textContent || ''), heading: el, nodes: [] });
        } else if (sections.length === 0) {
            preamble.push(el);
        } else {
            sections[sections.length - 1].nodes.push(el);
        }
    }

    modal.containerEl.addClass('sl-km-structure-tabs');
    const bar = createDiv('sl-km-tab-bar');
    const panels = new Map<StructureTab, HTMLElement>();
    for (const t of TABS) panels.set(t.id, createDiv({ cls: 'sl-km-tab-panel', attr: { 'data-tab': t.id } }));

    // Acts / Chapters: content as is (heading dropped, the tab names it).
    // Templates: each section becomes a collapsible block.
    for (const s of sections) {
        const panel = panels.get(s.tab)!;
        if (s.tab === 'templates') {
            const details = panel.createEl('details', { cls: 'sl-km-collapsible' });
            details.open = panel.childElementCount === 1; // first block open
            details.createEl('summary', { text: s.heading.textContent || '' });
            s.nodes.forEach(n => details.appendChild(n));
            s.heading.remove();
        } else {
            s.heading.remove();
            s.nodes.forEach(n => panel.appendChild(n));
        }
    }
    renderVolumesEditor(panels.get('volumes')!, ctx.app, ctx.projectFilePath, ctx.definedActs);

    // Reassemble: preamble, tab bar, panels, footer
    content.empty();
    preamble.forEach(n => content.appendChild(n));
    content.appendChild(bar);
    for (const t of TABS) content.appendChild(panels.get(t.id)!);
    if (footer) content.appendChild(footer);

    const buttons = new Map<StructureTab, HTMLElement>();
    const select = (id: StructureTab) => {
        for (const t of TABS) {
            buttons.get(t.id)!.toggleClass('is-active', t.id === id);
            panels.get(t.id)!.toggleClass('is-hidden', t.id !== id);
        }
        ctx.app.saveLocalStorage(STORAGE_KEY, id);
    };
    for (const t of TABS) {
        const btn = bar.createEl('button', { cls: 'sl-km-tab', text: t.label });
        btn.addEventListener('click', () => select(t.id));
        buttons.set(t.id, btn);
    }
    const saved: unknown = ctx.app.loadLocalStorage(STORAGE_KEY);
    select(TABS.some(t => t.id === saved) ? (saved as StructureTab) : 'acts');
}
