import type SceneCardsPlugin from '../main';
import { resolveTagColor, getPlotlineHSL, type PlotlineColorView } from '../settings';

/** True if the user turned on plotline colours for this view (Settings → Colors). */
export function plotlineColorsOn(plugin: SceneCardsPlugin | null | undefined, view: PlotlineColorView): boolean {
    return plugin?.settings.plotlineColorViews?.[view] ?? false;
}

/**
 * Colour of a plotline tag, resolved like the Board and the Navigator do:
 * index in the sorted list of all tags, custom tag colours, scheme and HSL adjustments.
 */
export function getPlotlineColor(plugin: SceneCardsPlugin, tag: string): string {
    const settings = plugin.settings;
    const allTags = plugin.sceneManager.queryService.getAllTags();
    return resolveTagColor(tag, Math.max(0, allTags.indexOf(tag)), settings.colorScheme, settings.tagColors || {}, getPlotlineHSL(settings));
}

/** True if the tag is used by at least one scene (i.e. is a known plotline). */
export function isPlotline(plugin: SceneCardsPlugin, tag: string): boolean {
    return plugin.sceneManager.queryService.getAllTags().includes(tag);
}
