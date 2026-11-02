// ═══════════════════════════════════════════════════════
//  Board (Kanban) with volumes (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// Pure helpers for the Board view: which act a scene created with "+" in a
// column gets while a volume is selected, and which defined chapters belong
// to the selected volume. Without a selected volume the Board behaves like
// upstream (only the Prologue / Epilogue columns get their act, see
// boardQuickAddAct).

import type { Scene } from '../models/Scene';
import { EPILOGUE_ACT, PROLOGUE_ACT } from './actChapter';
import { actNumber, type VolumeDef } from './volumes';

type ActValue = number | string | undefined;

/** True if the act is numerically one of the volume's acts (actNumber; Prologue/Epilogue are in no volume). */
function actInVolume(vol: VolumeDef, act: unknown): boolean {
    const n = actNumber(act);
    return n !== undefined && vol.acts.includes(n);
}

/** Same chapter: numerically when both are numbers ("05" and 5), else as text. */
function sameChapter(a: ActValue | null, b: ActValue | null): boolean {
    if (a === undefined || a === null || b === undefined || b === null) return false;
    const sa = String(a).trim();
    const sb = String(b).trim();
    const num = /^\d+(?:\.\d+)?$/;
    if (num.test(sa) && num.test(sb)) return Number(sa) === Number(sb);
    return sa === sb;
}

/**
 * The act of a chapter inside a volume: the one act that the volume's scenes
 * (corkboard notes and scenes without act left out, as upstream's
 * inferActForChapter does) with this chapter have, as a number ("06" and 6
 * are act 6, so the quick add dropdown shows it), else undefined.
 */
export function inferVolumeActForChapter(scenes: Scene[], vol: VolumeDef, chapter: ActValue): ActValue {
    const acts = new Set<number>();
    for (const s of scenes) {
        if (s.corkboardNote || s.act === undefined || s.act === null) continue;
        if (!sameChapter(s.chapter, chapter) || !actInVolume(vol, s.act)) continue;
        const n = actNumber(s.act);
        if (n !== undefined) acts.add(n);
    }
    return acts.size === 1 ? Array.from(acts)[0] : undefined;
}

export interface BoardQuickAddInput {
    groupBy: string;
    /** Column title the "+" button belongs to; undefined for the toolbar button. */
    presetColumn?: string;
    /** Act upstream derived from the column ("Act 5" → 5, chapter → inferActForChapter). */
    upstreamAct: ActValue;
    /** Selected volume, undefined for "All volumes" or a project without volumes. */
    volume?: VolumeDef;
    /** All scenes of the project (for the chapter → act mapping). */
    scenes: Scene[];
}

/**
 * Act for a scene created from the Board's quick add.
 *
 * - Grouped by act, from a column: the column decides. "Act N" keeps
 *   upstream's act, "Prologue" / "Epilogue" get PROLOGUE_ACT / EPILOGUE_ACT,
 *   "No Act" and other columns get no act. The volume's act is never forced
 *   onto such a column.
 * - Grouped by chapter, from a "Chapter N" column with a volume selected: the
 *   chapter's act inside the volume (inferVolumeActForChapter), else
 *   upstream's inferred act if it is in the volume, else the volume's first act.
 * - Otherwise (toolbar button, "No Chapter", status, POV, ...): the volume's
 *   first act while a volume is selected, else upstream's act.
 */
export function boardQuickAddAct(input: BoardQuickAddInput): ActValue {
    const { groupBy, presetColumn, upstreamAct, volume, scenes } = input;
    if (presetColumn !== undefined && groupBy === 'act') {
        const key = presetColumn.trim().toLowerCase();
        if (key === 'prologue') return PROLOGUE_ACT;
        if (key === 'epilogue') return EPILOGUE_ACT;
        return upstreamAct;
    }
    if (!volume || volume.acts.length === 0) return upstreamAct;
    if (presetColumn !== undefined && groupBy === 'chapter') {
        const m = presetColumn.match(/^Chapter\s+(.+)$/);
        if (m) {
            const inVolume = inferVolumeActForChapter(scenes, volume, m[1]);
            if (inVolume !== undefined) return inVolume;
            if (actInVolume(volume, upstreamAct)) return actNumber(upstreamAct);
        }
    }
    return volume.acts[0];
}

/**
 * Defined chapters (SceneManager.getDefinedChapters) that belong to the
 * selected volume: a chapter belongs to it if one of its scenes (corkboard
 * notes left out) has an act of the volume. Chapters without such a scene
 * (only defined, or only in scenes without act) are shown only under
 * "All volumes". Without a volume the list is returned unchanged.
 */
export function scopeDefinedChapters(chapters: number[], scenes: Scene[], volume: VolumeDef | undefined): number[] {
    if (!volume) return chapters;
    const inVolume = new Set<number>();
    for (const s of scenes) {
        if (s.corkboardNote || s.chapter === undefined || s.chapter === null) continue;
        if (!actInVolume(volume, s.act)) continue;
        const n = Number(s.chapter);
        if (!isNaN(n)) inVolume.add(n);
    }
    return chapters.filter(ch => inVolume.has(ch));
}
