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

/**
 * Paints a 4px plotline stripe as a background layer at the left edge of `el`, like the
 * Board's colour stripe, without changing borders, padding or layout. Several plotlines
 * split the stripe into equal segments from top to bottom, in tag order.
 * Elements without plotlines are left unchanged.
 */
export function applyPlotlineStripe(el: HTMLElement, tags: readonly string[] | undefined, colors: PlotlineColorResolver): void {
    if (!tags?.length) return;
    const step = 100 / tags.length;
    const stops = tags.map((tag, i) => `${colors.color(tag)} ${i * step}% ${(i + 1) * step}%`);
    el.setCssStyles({
        backgroundImage: `linear-gradient(to bottom, ${stops.join(', ')})`,
        backgroundSize: '4px 100%',
        backgroundRepeat: 'no-repeat',
    });
}
