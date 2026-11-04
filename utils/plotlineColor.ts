import type SceneCardsPlugin from '../main';
import { resolveTagColor, getPlotlineHSL, type PlotlineColorView } from '../settings';

/** Plotline colours for one render: all tags are read once, lookups are cheap. */
export interface PlotlineColorResolver {
    /** True if the tag is used by at least one scene (i.e. is a known plotline). */
    has(tag: string): boolean;
    /** Colour of the tag, resolved like the Board and the Navigator chips. */
    color(tag: string): string;
}

/**
 * Returns a resolver if the user turned on plotline colours for this view
 * (Settings → Colors → "Transfer plotline colors to"), otherwise null.
 * Create it once per render and reuse it for every element.
 */
export function makePlotlineColorResolver(
    plugin: SceneCardsPlugin | null | undefined,
    view: PlotlineColorView,
): PlotlineColorResolver | null {
    if (!plugin?.settings.plotlineColorViews?.[view]) return null;
    const settings = plugin.settings;
    const index = new Map<string, number>();
    plugin.sceneManager.queryService.getAllTags().forEach((tag, i) => index.set(tag, i));
    const tagColors = settings.tagColors || {};
    const hsl = getPlotlineHSL(settings);
    const cache = new Map<string, string>();
    return {
        has: (tag) => index.has(tag),
        color: (tag) => {
            let color = cache.get(tag);
            if (color === undefined) {
                color = resolveTagColor(tag, index.get(tag) ?? 0, settings.colorScheme, tagColors, hsl);
                cache.set(tag, color);
            }
            return color;
        },
    };
}
