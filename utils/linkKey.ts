// ═══════════════════════════════════════════════════════
//  Link and name normalization (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// One rule for the fork modules that compare character names (characters,
// POV, character filter) and resolve Arc Point `realizedBy` links:
//
//   "[[Folder/Name.md#Heading|Alias]]" → linkpathOf → "Folder/Name.md"
//                                      → linkName   → "Name"
//                                      → linkKey    → "name"
//
// - A wikilink names its TARGET; the alias is display text only (Obsidian's
//   rule, and upstream's for `pov` / `characters`).
// - Folder path (also "\") and a trailing ".md" are dropped, like
//   MetadataParser's stripPathAndExtension.
// - In a plain value (no [[ ]]), "|" and "#" are part of the name: a scene
//   title such as "Scene #3" stays as it is.
//
// The parser already cleans `pov` and `characters`
// (MetadataParser.cleanEntityWikilinkTarget), so for those parsed values
// this only lower-cases; it matters for raw frontmatter (`realizedBy`) and
// filter input. Setup/payoff links are NOT matched with this rule: they
// compare the parsed value with the raw scene title exactly as upstream's
// Validator does (volumeSetups, volumeStatsScope).

/** Inner text of "[[...]]", or undefined for a plain value. */
function wikilinkInner(raw: string): string | undefined {
    const m = raw.match(/^\[\[(.*)\]\]$/);
    return m ? m[1] : undefined;
}

/**
 * Link path for Obsidian's link resolution (getFirstLinkpathDest):
 * "[[Folder/Title#h|Alias]]" → "Folder/Title". Folders are kept. A plain
 * value is treated as a link path too ("Title#h" → "Title").
 */
export function linkpathOf(raw: string | null | undefined): string {
    const t = String(raw ?? '').trim();
    return (wikilinkInner(t) ?? t).split('|')[0].split('#')[0].trim();
}

/**
 * Name part of a link or a plain name, case preserved:
 * "[[Folder/Name.md#h|Alias]]" → "Name", "Folder/Name.md" → "Name",
 * "Name" → "Name". For exact matches against a scene title.
 */
export function linkName(raw: string | null | undefined): string {
    const t = String(raw ?? '').trim();
    const inner = wikilinkInner(t);
    let name = inner === undefined ? t : inner.split('|')[0].split('#')[0];
    name = name.slice(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1).trim();
    if (name.toLowerCase().endsWith('.md')) name = name.slice(0, -3).trim();
    return name;
}

/** Case-insensitive comparison key of a link or a name: linkName in lower case. */
export function linkKey(raw: string | null | undefined): string {
    return linkName(raw).toLowerCase();
}
