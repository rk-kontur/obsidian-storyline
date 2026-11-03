// Characters, Locations and Codex only list scenes of the selected volume.
// Without a hint, an entity whose scenes are all in other volumes would look
// unused. These helpers say what the volume selection hides; without a
// selected volume they render nothing.

import type SceneCardsPlugin from '../main';
import type { Scene } from '../models/Scene';
import { getScopedVolume } from '../utils/volumeScope';

function scopedTitle(plugin: SceneCardsPlugin): string | undefined {
    return getScopedVolume(plugin.app, plugin.sceneManager.activeProject?.filePath)?.title;
}

/** Empty text for a scene count: "No scenes in Volume 2" with a volume selected, else `fallback`. */
export function scopedNoScenesText(plugin: SceneCardsPlugin, fallback: string): string {
    const title = scopedTitle(plugin);
    return title ? `No scenes in ${title}` : fallback;
}

/**
 * Text for items hidden by the volume selection, or '' when nothing is hidden
 * or no volume is selected. `shown` 0: "No scenes in Volume 2 (3 in other
 * volumes)", otherwise "3 more in other volumes".
 */
export function scopeHiddenText(plugin: SceneCardsPlugin, shown: number, hidden: number, noun = 'scenes'): string {
    const title = scopedTitle(plugin);
    if (!title || hidden <= 0) return '';
    return shown === 0
        ? `No ${noun} in ${title} (${hidden} in other volumes)`
        : `${hidden} more in other volumes`;
}

/** Muted note line with scopeHiddenText; renders nothing when nothing is hidden. */
export function renderScopeHiddenNote(parent: HTMLElement, plugin: SceneCardsPlugin, shown: number, hidden: number, noun = 'scenes'): void {
    const text = scopeHiddenText(plugin, shown, hidden, noun);
    if (text) parent.createEl('p', { cls: 'story-line-scope-hidden-note', text });
}

/**
 * "Referenced by" of a character or location when every reference is a scene
 * in another volume: show the heading and the note instead of hiding the
 * section (which would look like "never referenced"). Returns true if rendered.
 */
export function renderScopedReferencesEmpty(container: HTMLElement, plugin: SceneCardsPlugin, sectionCls: string, hidden: number): boolean {
    const text = scopeHiddenText(plugin, 0, hidden, 'references');
    if (!text) return false;
    const section = container.createDiv(sectionCls);
    section.createEl('h3', { text: 'Referenced by' });
    section.createEl('p', { cls: 'story-line-scope-hidden-note', text });
    return true;
}

/**
 * Characters that only appear in scenes ("no profile yet"), limited to the
 * scenes of the selected volume (`characters` and `pov`, compared in lower
 * case like getAllCharacters). Returns `names` unchanged without a selection.
 */
export function scopeSceneCharacterNames(plugin: SceneCardsPlugin, names: string[], scopedScenes: Scene[]): string[] {
    if (!scopedTitle(plugin)) return names;
    const inScope = new Set<string>();
    for (const scene of scopedScenes) {
        for (const c of scene.characters ?? []) inScope.add(c.toLowerCase());
        if (scene.pov) inScope.add(scene.pov.toLowerCase());
    }
    return names.filter(n => inScope.has(n.toLowerCase()));
}
