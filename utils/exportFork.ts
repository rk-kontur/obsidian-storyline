// ═══════════════════════════════════════════════════════
//  Export helpers (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Small pure helpers for ExportService / ExportModal, kept here so the
// upstream files only get one-line hooks.

import { sanitizeActChapterForPath } from './actChapter';

/**
 * File name label of a volume export, e.g. "Manuscript - Volume 2" instead of
 * "Manuscript - Acts 5,6,7,8". The volume title is sanitized with upstream's
 * file name rule (Windows-illegal characters become "-", no trailing dots or
 * spaces). Returns undefined when there is no usable title, so the caller
 * keeps its own label.
 */
export function volumeExportLabel(base: string, volumeTitle: string | undefined): string | undefined {
    const safe = volumeTitle ? sanitizeActChapterForPath(volumeTitle) : '';
    return safe ? `${base} - ${safe}` : undefined;
}

/** Drops Arc Points (`arcAnchor`) unless `include` is true. */
export function filterArcPointsForExport<T extends { arcAnchor?: boolean }>(scenes: T[], include: boolean): T[] {
    return include ? scenes : scenes.filter(s => !s.arcAnchor);
}
