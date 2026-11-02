// ═══════════════════════════════════════════════════════
//  Keep Arc Point "realizedBy" links on file rename (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// With Obsidian's "Automatically update internal links" switched on,
// Obsidian rewrites `realizedBy` itself (it is a frontmatter link). With the
// setting off, a renamed scene breaks the link, and the title / file name
// fallback in utils/arcRealization.ts no longer matches either.
//
// This listener only runs while the setting is off and only rewrites values
// that name the old path or old file name exactly and no longer resolve to
// any file (see utils/realizedByRename.ts). Registered from ForkCommands.

import { TFile } from 'obsidian';
import type { App, Plugin } from 'obsidian';
import { REALIZED_BY_KEY } from '../utils/arcRealization';
import { renamedRealizedBy } from '../utils/realizedByRename';

const KEYS = [REALIZED_BY_KEY, 'realized_by'];

/**
 * True when Obsidian updates links on rename itself. Unknown (no config
 * API) counts as true, so the listener stays out of the way.
 */
function obsidianUpdatesLinks(app: App): boolean {
    const vault = app.vault as unknown as { getConfig?: (key: string) => unknown };
    if (typeof vault.getConfig !== 'function') return true;
    return vault.getConfig('alwaysUpdateLinks') === true;
}

async function syncRealizedBy(app: App, file: TFile, oldPath: string): Promise<void> {
    for (const arc of app.vault.getMarkdownFiles()) {
        if (arc.path === file.path) continue;
        const fm = app.metadataCache.getFileCache(arc)?.frontmatter;
        if (!fm) continue;
        for (const key of KEYS) {
            const raw: unknown = fm[key];
            if (typeof raw !== 'string') continue;
            const newLinkpath = app.metadataCache.fileToLinktext(file, arc.path, true);
            const next = renamedRealizedBy(raw, oldPath, newLinkpath,
                lp => !!app.metadataCache.getFirstLinkpathDest(lp, arc.path));
            if (next === undefined) continue;
            try {
                await app.fileManager.processFrontMatter(arc, (front: Record<string, unknown>) => {
                    // Rewrite only if the value is still the one we checked
                    if (front[key] === raw) front[key] = next;
                });
            } catch (e) {
                console.error('StoryLine: could not update realizedBy in', arc.path, e);
            }
        }
    }
}

export function registerRealizedByRenameSync(plugin: Plugin): void {
    const { app } = plugin;
    plugin.registerEvent(app.vault.on('rename', (file, oldPath) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        if (obsidianUpdatesLinks(app)) return;
        void syncRealizedBy(app, file, oldPath);
    }));
}
