// ═══════════════════════════════════════════════════════
//  Read layout numbers from CSS variables (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Lets themes and CSS snippets (e.g. via Style Settings) tune layout values
// that views compute in JavaScript, such as Subway station spacing.
// Missing or invalid variable → the upstream default is used.

export function readCssNumber(el: HTMLElement, name: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}
