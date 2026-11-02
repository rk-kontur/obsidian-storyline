// ═══════════════════════════════════════════════════════
//  realizedBy after a file rename: pure rewrite rule (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Used by services/RealizedByRenameSync.ts. Kept free of Obsidian imports so
// the rule can be tested on its own.

/**
 * New `realizedBy` value after the file at `oldPath` was renamed, or
 * undefined when the value must stay as it is.
 *
 * Only exact matches are rewritten: the link path (without alias and
 * heading) must equal the old vault path (with or without ".md") or the old
 * file name (with or without ".md"). Relative paths, other spellings and
 * different case are left alone.
 *
 * `stillResolves(linkpath)` must report whether the old link path still
 * resolves to some file after the rename. If it does (for example another
 * file with the same name exists), the link is ambiguous and is not touched.
 *
 * Alias and heading (`[[Old#Part|shown]]`) and the bracket style of the raw
 * value are kept; only the link path becomes `newLinkpath`.
 */
export function renamedRealizedBy(
    raw: string,
    oldPath: string,
    newLinkpath: string,
    stillResolves: (linkpath: string) => boolean,
): string | undefined {
    const trimmed = raw.trim();
    const bracket = /^\[\[(.*)\]\]$/.exec(trimmed);
    const inner = bracket ? bracket[1] : trimmed;
    const cut = inner.search(/[#|]/);
    const linkpath = (cut < 0 ? inner : inner.slice(0, cut)).trim();
    const rest = cut < 0 ? '' : inner.slice(cut);
    if (!linkpath || !newLinkpath) return undefined;

    const oldNoExt = oldPath.replace(/\.md$/i, '');
    const oldBase = oldNoExt.split('/').pop() ?? '';
    const exact = [oldPath, oldNoExt, oldBase, `${oldBase}.md`];
    if (!exact.includes(linkpath)) return undefined;
    if (stillResolves(linkpath)) return undefined;

    const next = bracket ? `[[${newLinkpath}${rest}]]` : `${newLinkpath}${rest}`;
    return next === trimmed ? undefined : next;
}
