// ═══════════════════════════════════════════════════════
//  Open setups at the end of each volume (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// A setup is "open at the end of volume N" if the setup scene lies in
// volume N or earlier and none of its payoffs lies in volume N or earlier.
// Links are read from both directions (payoff_scenes on the setup,
// setup_scenes on the payoff), matched by scene title like the Validator.

import type { Scene } from '../models/Scene';
import { getVolumeForAct, type VolumeDef } from './volumes';

export interface OpenSetup {
    setup: Scene;
    /** Titles of payoffs with their volume title, or "missing". */
    payoffs: { title: string; where: string }[];
}

export interface VolumeOpenSetups {
    volume: VolumeDef;
    open: OpenSetup[];
}

/** Normalise a link value: strips [[ ]], alias and .md. */
function linkTitle(raw: string): string {
    let t = String(raw).trim();
    const m = t.match(/^\[\[(.*)\]\]$/);
    if (m) t = m[1];
    t = t.split('|')[0];
    t = t.split('/').pop() || t;
    return t.replace(/\.md$/i, '').trim();
}

export function computeOpenSetups(volumes: VolumeDef[], scenes: Scene[]): VolumeOpenSetups[] {
    if (volumes.length === 0) return [];
    // Chronology = act order, not the order of the list in the project file
    const firstAct = (v: VolumeDef) => (v.acts.length ? Math.min(...v.acts) : Infinity);
    const chrono = volumes.map((v, i) => ({ v, i })).sort((a, b) => firstAct(a.v) - firstAct(b.v) || a.i - b.i).map(x => x.v);
    const volIndex = new Map(chrono.map((v, i) => [v.id, i]));
    const byTitle = new Map<string, Scene>();
    for (const s of scenes) if (s.title) byTitle.set(s.title, s);

    // setup filePath → set of payoff titles
    const links = new Map<string, Set<string>>();
    const add = (setup: Scene, payoffTitle: string) => {
        if (!links.has(setup.filePath)) links.set(setup.filePath, new Set());
        links.get(setup.filePath)!.add(payoffTitle);
    };
    for (const s of scenes) {
        for (const p of s.payoff_scenes ?? []) add(s, linkTitle(p));
        for (const st of s.setup_scenes ?? []) {
            const setup = byTitle.get(linkTitle(st));
            if (setup && s.title) add(setup, s.title);
        }
    }

    const sceneByPath = new Map(scenes.map(s => [s.filePath, s]));
    const idxOf = (s: Scene | undefined): number | undefined => {
        if (!s) return undefined;
        const v = getVolumeForAct(volumes, s.act);
        return v ? volIndex.get(v.id) : undefined;
    };

    // Reported in the project file's order (like the volume table)
    return volumes.map(volume => {
        const n = volIndex.get(volume.id)!;
        const open: OpenSetup[] = [];
        for (const [path, payoffTitles] of links) {
            const setup = sceneByPath.get(path);
            const si = idxOf(setup);
            if (!setup || si === undefined || si > n) continue;
            const payoffs = [...payoffTitles].map(title => {
                const target = byTitle.get(title);
                const ti = idxOf(target);
                return { title, idx: ti, where: target ? (ti !== undefined ? chrono[ti].title : 'no volume') : 'missing' };
            });
            const resolved = payoffs.some(p => p.idx !== undefined && p.idx <= n);
            if (!resolved) open.push({ setup, payoffs: payoffs.map(({ title, where }) => ({ title, where })) });
        }
        open.sort((a, b) => (Number(a.setup.act) || 0) - (Number(b.setup.act) || 0) || (a.setup.sequence ?? 0) - (b.setup.sequence ?? 0));
        return { volume, open };
    });
}
