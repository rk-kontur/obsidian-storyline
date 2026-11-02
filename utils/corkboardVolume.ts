// ═══════════════════════════════════════════════════════
//  Corkboard with volumes (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The Corkboard places cards at stored world positions (board.json). When a
// volume is selected, the cards of the other volumes are hidden, but the
// camera stayed where it was, so later volumes sat far away. This module
// only pans the camera (nothing is written to disk) and remembers the camera
// per volume in memory:
//
// - Switching to a volume restores the camera last used there; without one,
//   the camera pans (at the current zoom) so the top-left of the volume's
//   cards sits a small padding from the viewport's top-left.
// - Switching back to "All volumes" restores the camera used there; without
//   one, the camera stays as it is (upstream behaviour).
// - The box uses only scenes whose act is in the volume. Corkboard notes and
//   scenes without an act are visible in every volume and do not count.
//   Only if the volume has no such cards, all visible cards are used.
//
// Side fix: a scene without a stored position gets an initial grid position
// that IS saved. Upstream uses its index in the filtered list, so with a
// volume selected new scenes landed near the origin, on top of Volume 1 in
// "All volumes". With a volume selected they now continue a grid below the
// volume's lowest card (below all cards if the volume has none yet).
//
// Projects without volumes are not touched at all.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { getProjectVolumes, type VolumeDef } from './volumes';
import { actInVolumeScope, getScopedVolume } from './volumeScope';

export interface CorkboardCamera { x: number; y: number; zoom: number }
export interface WorldPos { x: number; y: number }
/** Box over card top-left positions (world coordinates). */
export interface PosBox { left: number; top: number; right: number; bottom: number }

/** Screen padding between the viewport's top-left and the volume's top-left card. */
export const VOLUME_PAN_PADDING = 48;
/** Upstream's initial grid: 4 columns, 320 x 230 world px per cell. */
const GRID_COLS = 4;
const GRID_DX = 320;
const GRID_DY = 230;

type GetPos = (path: string) => WorldPos | undefined;
type IsNote = (scene: Scene) => boolean;

/** Box over the given positions, or null if there are none. */
export function positionsBox(positions: Iterable<WorldPos | undefined>): PosBox | null {
    let box: PosBox | null = null;
    for (const p of positions) {
        if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        if (!box) box = { left: p.x, top: p.y, right: p.x, bottom: p.y };
        else {
            box.left = Math.min(box.left, p.x);
            box.top = Math.min(box.top, p.y);
            box.right = Math.max(box.right, p.x);
            box.bottom = Math.max(box.bottom, p.y);
        }
    }
    return box;
}

/** True for a scene that belongs to the volume itself: has an act in it and is no corkboard note. */
export function isOwnVolumeScene(vol: VolumeDef, scene: Scene, isNote: IsNote): boolean {
    if (scene.act === undefined || scene.act === '' || isNote(scene)) return false;
    return actInVolumeScope(vol, scene.act);
}

/** Box over the stored positions of the volume's own scenes (see isOwnVolumeScene). */
export function volumeBox(vol: VolumeDef, scenes: Scene[], getPos: GetPos, isNote: IsNote): PosBox | null {
    return positionsBox(scenes.filter(s => isOwnVolumeScene(vol, s, isNote)).map(s => getPos(s.filePath)));
}

/** Camera offset (current zoom) that puts the box's top-left at `padding` screen px from the viewport's top-left. */
export function panToTopLeft(box: PosBox, zoom: number, padding = VOLUME_PAN_PADDING): { x: number; y: number } {
    return { x: padding - box.left * zoom, y: padding - box.top * zoom };
}

/**
 * Camera memory of one view: the camera per volume id ('' = All volumes) of
 * the current project, and the key of the last corkboard render. In memory
 * only; cleared when the project changes.
 */
export class CorkboardVolumeCameras {
    private cameras = new Map<string, CorkboardCamera>();
    private project: string | undefined;
    private lastVolume: string | undefined;

    /**
     * Called on every corkboard render. Returns the camera to apply, or null
     * to keep the current one. `volumePan` computes the pan for a volume
     * without a remembered camera (null: keep the camera).
     */
    update(
        project: string,
        volumeId: string,
        current: CorkboardCamera,
        volumePan: () => { x: number; y: number } | null,
    ): CorkboardCamera | null {
        if (project !== this.project) {
            // Other project (or first render): no camera of another book is restored.
            this.cameras.clear();
            this.project = project;
            this.lastVolume = undefined;
        }
        const prev = this.lastVolume;
        this.lastVolume = volumeId;
        if (prev === volumeId) return null;
        if (prev !== undefined) this.cameras.set(prev, { ...current });
        const remembered = this.cameras.get(volumeId);
        if (remembered) return { ...remembered };
        if (!volumeId) return null; // "All volumes" without memory: keep the camera
        const pan = volumePan();
        return pan ? { x: pan.x, y: pan.y, zoom: current.zoom } : null;
    }

    /** Forget everything (project without volumes). */
    reset(): void {
        this.cameras.clear();
        this.project = undefined;
        this.lastVolume = undefined;
    }
}

/**
 * Corkboard render hook, after the cards got their positions: switch the
 * camera for the selected volume (see module comment). Mutates `camera`
 * in place and returns true if it changed. No-op without volumes.
 */
export function applyCorkboardVolumeCamera(
    state: CorkboardVolumeCameras,
    app: App,
    projectFilePath: string | undefined | null,
    visibleScenes: Scene[],
    camera: CorkboardCamera,
    getPos: GetPos,
    isNote: IsNote,
): boolean {
    if (getProjectVolumes(app, projectFilePath).length === 0) {
        state.reset();
        return false;
    }
    const vol = getScopedVolume(app, projectFilePath);
    const next = state.update(projectFilePath ?? '', vol?.id ?? '', camera, () => {
        if (!vol) return null;
        const box = volumeBox(vol, visibleScenes, getPos, isNote)
            ?? positionsBox(visibleScenes.map(s => getPos(s.filePath)));
        return box ? panToTopLeft(box, camera.zoom) : null;
    });
    if (!next) return false;
    camera.x = next.x;
    camera.y = next.y;
    camera.zoom = next.zoom;
    return true;
}

/**
 * Initial grid position for scenes without a stored position while a volume
 * is selected: a 4-column grid that continues one row below the volume's
 * lowest card, starting at its leftmost card. Without positioned volume
 * cards: one row below the lowest card of the whole board, at x = 0 (the
 * origin if the board is empty). Cells that overlap a stored card (of any
 * volume, note or scene without an act) or a cell handed out before are
 * skipped. Returns null without a selected volume, then upstream's index
 * grid applies. Each call returns the next free cell.
 */
export function corkboardVolumePlacer(
    app: App,
    projectFilePath: string | undefined | null,
    allScenes: Scene[],
    allPositions: Iterable<WorldPos>,
    getPos: GetPos,
    isNote: IsNote,
): (() => { x: number; y: number }) | null {
    const vol = getScopedVolume(app, projectFilePath);
    if (!vol) return null;
    const taken = Array.from(allPositions);
    return gridPlacer(volumeBox(vol, allScenes, getPos, isNote), positionsBox(taken), taken);
}

/** Pure part of corkboardVolumePlacer. */
export function gridPlacer(volBox: PosBox | null, boardBox: PosBox | null, taken: WorldPos[] = []): () => { x: number; y: number } {
    const originX = volBox ? volBox.left : 0;
    const originY = volBox ? volBox.bottom + GRID_DY : boardBox ? boardBox.bottom + GRID_DY : 0;
    const used: WorldPos[] = [...taken];
    const free = (x: number, y: number) => !used.some(p => Math.abs(p.x - x) < GRID_DX && Math.abs(p.y - y) < GRID_DY);
    let n = 0;
    return () => {
        let cell: { x: number; y: number };
        do {
            const i = n++;
            cell = { x: originX + (i % GRID_COLS) * GRID_DX, y: originY + Math.floor(i / GRID_COLS) * GRID_DY };
        } while (!free(cell.x, cell.y) && n < 100000);
        used.push(cell);
        return cell;
    };
}
