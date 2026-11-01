// ═══════════════════════════════════════════════════════
//  "Manage story structure" as collapsible sections (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The dialog is built by BoardView / TimelineView exactly as upstream does.
// Right before it opens, this module regroups its content at the existing
// <h3> headings into collapsible sections that look like the plugin
// settings (same classes: story-line-settings-section):
//
//   ▸ Volumes   ▸ Acts   ▸ Chapters   ▸ Templates
//
// Templates holds the beat sheet blocks as nested collapsible blocks.
// Open/closed state is remembered per section. If the expected headings
// are not found (upstream changed the dialog), the dialog is left as it is.

import type { App, Modal } from 'obsidian';
import { renderVolumesEditor } from './VolumesEditor';

export type StructureSection = 'volumes' | 'acts' | 'chapters' | 'templates';

const SECTIONS: { id: StructureSection; label: string }[] = [
    { id: 'volumes', label: 'Volumes' },
    { id: 'acts', label: 'Acts' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'templates', label: 'Templates' },
];

const OPEN_KEY = 'storyline-km:structureOpenSections';
const FORCE_KEY = 'storyline-km:structureForceOpen';

function sectionForHeading(text: string): StructureSection {
    const t = text.trim().toLowerCase();
    if (t === 'acts') return 'acts';
    if (t === 'chapters') return 'chapters';
    return 'templates';
}

function loadOpen(app: App): Set<StructureSection> {
    const raw: unknown = app.loadLocalStorage(OPEN_KEY);
    if (Array.isArray(raw)) return new Set(raw.filter((x): x is StructureSection => SECTIONS.some(s => s.id === x)));
    return new Set<StructureSection>(['acts']);
}

/** Open the given section the next time the dialog opens (used by commands). */
export function setNextStructureSection(app: App, section: StructureSection): void {
    app.saveLocalStorage(FORCE_KEY, section);
}

export interface StructureModalContext {
    app: App;
    projectFilePath: string | undefined;
    /** Getter, so acts added in the same dialog (beat sheet, Add acts) are seen. */
    getDefinedActs: () => number[];
}

export function enhanceStructureModal(modal: Modal, ctx: StructureModalContext): void {
    const content = modal.contentEl;
    const children = Array.from(content.children) as HTMLElement[];
    const names = children.filter(el => el.tagName === 'H3').map(h => (h.textContent || '').trim().toLowerCase());
    if (!names.includes('acts') || !names.includes('chapters')) return; // unknown layout: leave untouched

    // The real footer is the LAST .structure-close-row ("Done"). Other rows with the
    // same class (e.g. "Apply custom structure") belong to their section.
    const closeRows = children.filter(el => el.classList.contains('structure-close-row'));
    const footer = closeRows[closeRows.length - 1];

    const preamble: HTMLElement[] = [];
    const groups: { section: StructureSection; heading: HTMLElement; nodes: HTMLElement[] }[] = [];
    for (const el of children) {
        if (el === footer) continue;
        if (el.tagName === 'H3') {
            groups.push({ section: sectionForHeading(el.textContent || ''), heading: el, nodes: [] });
        } else if (groups.length === 0) {
            preamble.push(el);
        } else {
            groups[groups.length - 1].nodes.push(el);
        }
    }

    modal.containerEl.addClass('sl-km-structure-modal');

    const open = loadOpen(ctx.app);
    const forced: unknown = ctx.app.loadLocalStorage(FORCE_KEY);
    if (typeof forced === 'string' && SECTIONS.some(s => s.id === forced)) {
        open.add(forced as StructureSection);
        ctx.app.saveLocalStorage(FORCE_KEY, null);
    }
    const saveOpen = () => ctx.app.saveLocalStorage(OPEN_KEY, [...open]);

    // Same markup and classes as the plugin settings sections
    const bodies = new Map<StructureSection, HTMLElement>();
    const sectionEls: HTMLElement[] = [];
    for (const s of SECTIONS) {
        const details = createEl('details', { cls: 'story-line-settings-section' });
        details.open = open.has(s.id);
        details.createEl('summary', { text: s.label });
        details.addEventListener('toggle', () => {
            if (details.open) open.add(s.id); else open.delete(s.id);
            saveOpen();
        });
        bodies.set(s.id, details.createDiv('story-line-settings-section-body'));
        sectionEls.push(details);
    }

    for (const g of groups) {
        const body = bodies.get(g.section)!;
        if (g.section === 'templates') {
            // Nested blocks, like "Image settings" inside a settings section
            const sub = body.createEl('details', { cls: 'story-line-color-section sl-km-structure-sub' });
            sub.open = body.childElementCount === 1; // first block open
            sub.createEl('summary', { text: g.heading.textContent || '' });
            g.nodes.forEach(n => sub.appendChild(n));
        } else {
            g.nodes.forEach(n => body.appendChild(n));
        }
        g.heading.remove();
    }
    renderVolumesEditor(bodies.get('volumes')!, ctx.app, ctx.projectFilePath, ctx.getDefinedActs);

    content.empty();
    preamble.forEach(n => content.appendChild(n));
    sectionEls.forEach(n => content.appendChild(n));
    if (footer) content.appendChild(footer);
}
