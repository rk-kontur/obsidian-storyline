// Statistics per volume.
//
// The Statistics view follows the shared volume selection:
//   - a volume is selected → every section counts only the volume's own
//     scenes (scenes without an act are not counted); word goal and
//     deadline come from the volume.
//   - "All volumes"        → every section counts the whole project; the
//     word goal is the sum of the volume goals and the deadline is the
//     project deadline, else the latest volume deadline.
// Without `volumes:` every helper here returns upstream's values.

import type { App } from 'obsidian';
import type { Scene } from '../models/Scene';
import { Validator, type PlotWarning } from '../services/Validator';
import { getProjectVolumes, getVolumeForAct, type VolumeDef } from './volumes';
import { getScopedVolume, volumeScopePredicate } from './volumeScope';

export interface StatsScope {
    volumes: VolumeDef[];
    /** Selected volume; undefined for "All volumes" or without volumes. */
    volume?: VolumeDef;
    /** True for scenes counted in the selected volume (always true without one). */
    inScope: (scene: Scene) => boolean;
    /** Active scenes of the project (no inactive scenes, no corkboard notes). */
    projectScenes: Scene[];
    /** projectScenes inside the selected volume. */
    scenes: Scene[];
}

export function getStatsScope(app: App, projectFilePath: string | undefined | null, projectScenes: Scene[]): StatsScope {
    const volumes = getProjectVolumes(app, projectFilePath);
    const volume = volumes.length ? getScopedVolume(app, projectFilePath) : undefined;
    const inScope = volume ? volumeScopePredicate(app, projectFilePath, false) : () => true;
    return { volumes, volume, inScope, projectScenes, scenes: volume ? projectScenes.filter(inScope) : projectScenes };
}

/** Heading of the Statistics view. */
export function statsHeading(scope: StatsScope): string {
    if (scope.volume) return `${scope.volume.title} statistics`;
    return scope.volumes.length ? 'Project statistics (all volumes)' : 'Project statistics';
}

/** Sum of the volume word goals, or undefined if no volume has one. */
export function totalVolumeGoal(volumes: VolumeDef[]): number | undefined {
    const goals = volumes.map(v => v.wordGoal).filter((g): g is number => !!g);
    return goals.length ? goals.reduce((a, b) => a + b, 0) : undefined;
}

/** Latest volume deadline (YYYY-MM-DD), or undefined. */
export function latestVolumeDeadline(volumes: VolumeDef[]): string | undefined {
    const ds = volumes.map(v => v.deadline).filter((d): d is string => !!d).sort();
    return ds.length ? ds[ds.length - 1] : undefined;
}

/**
 * Word goal of the overview (0 if none).
 * Volume: its goal, else the scene targets of the volume, else the project goal.
 * All volumes: sum of the volume goals, else the project goal, else the scene targets.
 * No volumes: the project goal, else the scene targets (upstream).
 */
export function scopedWordGoal(scope: StatsScope, projectGoal: number | undefined, sceneTargets: number): number {
    if (scope.volume) return scope.volume.wordGoal || sceneTargets || projectGoal || 0;
    return totalVolumeGoal(scope.volumes) || projectGoal || sceneTargets || 0;
}

/**
 * Deadline of the overview.
 * Volume: its deadline, else the project deadline.
 * All volumes: the project deadline, else the latest volume deadline.
 */
export function scopedDeadline<T extends { deadline: string }>(scope: StatsScope, project: T): T {
    if (scope.volume) return scope.volume.deadline ? { ...project, deadline: scope.volume.deadline } : project;
    const latest = project.deadline ? undefined : latestVolumeDeadline(scope.volumes);
    return latest ? { ...project, deadline: latest } : project;
}

/**
 * Scoped scenes plus the scenes of other volumes they are linked with by
 * setup/payoff, in project order, for the Setup & Payoff map and the
 * Validator. The linked scenes are copies that keep only their links into
 * the scope, so their own links elsewhere are neither drawn nor reported as
 * broken. Links match like the Validator's: link value === scene title.
 */
export function withLinkPartners(scoped: Scene[], project: Scene[]): Scene[] {
    if (scoped.length === project.length) return scoped;
    const inScope = new Set(scoped.map(s => s.filePath));
    const scopedTitles = new Set(scoped.map(s => s.title));
    const byTitle = new Map(project.map(s => [s.title, s]));
    const extra = new Set<string>();
    const add = (title: string) => {
        const t = byTitle.get(title);
        if (t && !inScope.has(t.filePath)) extra.add(t.filePath);
    };
    for (const s of scoped) {
        (s.setup_scenes ?? []).forEach(add);
        (s.payoff_scenes ?? []).forEach(add);
    }
    // Scenes outside the scope that point into it
    const pointsIn = (titles: string[] | undefined) => (titles ?? []).some(t => scopedTitles.has(t));
    for (const s of project) {
        if (!inScope.has(s.filePath) && (pointsIn(s.setup_scenes) || pointsIn(s.payoff_scenes))) extra.add(s.filePath);
    }
    return project
        .filter(s => inScope.has(s.filePath) || extra.has(s.filePath))
        .map(s => inScope.has(s.filePath) ? s : {
            ...s,
            setup_scenes: s.setup_scenes?.filter(t => scopedTitles.has(t)),
            payoff_scenes: s.payoff_scenes?.filter(t => scopedTitles.has(t)),
        });
}

const SETUP_PAYOFF = 'Setup/Payoff';
/** Categories the Validator reports after Setup/Payoff. */
const AFTER_SETUP_PAYOFF = ['Structure', 'Pacing'];

/**
 * Validator warnings for the scope. All checks run on the scoped scenes, so
 * plotline gaps and act imbalance describe the volume. Setup/Payoff runs
 * with the linked scenes of other volumes (a payoff in a later volume is not
 * "missing") and keeps the warnings that involve a scoped scene.
 */
export function validateForScope(scoped: Scene[], project: Scene[]): PlotWarning[] {
    const own = Validator.validate(scoped);
    if (scoped.length === project.length) return own;
    const inScope = new Set(scoped.map(s => s.filePath));
    const linked = Validator.validate(withLinkPartners(scoped, project))
        .filter(w => w.category === SETUP_PAYOFF && (w.scenePaths ?? []).some(p => inScope.has(p)));
    // Keep the Validator's category order
    let at = own.findIndex(w => w.category === SETUP_PAYOFF);
    if (at < 0) at = own.findIndex(w => AFTER_SETUP_PAYOFF.includes(w.category));
    const rest = own.filter(w => w.category !== SETUP_PAYOFF);
    if (at < 0) return [...rest, ...linked];
    const before = own.slice(0, at).filter(w => w.category !== SETUP_PAYOFF).length;
    return [...rest.slice(0, before), ...linked, ...rest.slice(before)];
}

export interface OpenSetup {
    setup: Scene;
    /** Payoff titles with the title of their volume, "no volume" or "missing". */
    payoffs: { title: string; where: string }[];
}

/**
 * Setups still open at the end of each volume: the setup lies in this volume
 * or an earlier one and none of its payoffs does. Volumes are ordered by
 * their first act; links are read from both sides and match like the
 * Validator's. Returned in the order of the project file.
 */
export function computeOpenSetups(volumes: VolumeDef[], scenes: Scene[]): { volume: VolumeDef; open: OpenSetup[] }[] {
    const firstAct = (v: VolumeDef) => (v.acts.length ? Math.min(...v.acts) : Infinity);
    const chrono = volumes.map((v, i) => ({ v, i }))
        .sort((a, b) => firstAct(a.v) - firstAct(b.v) || a.i - b.i)
        .map(x => x.v);
    const volIndex = new Map(chrono.map((v, i) => [v.id, i]));
    const byTitle = new Map<string, Scene>();
    for (const s of scenes) if (s.title) byTitle.set(s.title, s);

    // setup filePath → payoff titles
    const links = new Map<string, Set<string>>();
    const add = (setup: Scene, payoffTitle: string) => {
        let set = links.get(setup.filePath);
        if (!set) links.set(setup.filePath, set = new Set());
        set.add(payoffTitle);
    };
    for (const s of scenes) {
        for (const p of s.payoff_scenes ?? []) add(s, p);
        for (const st of s.setup_scenes ?? []) {
            const setup = byTitle.get(st);
            if (setup && s.title) add(setup, s.title);
        }
    }

    const sceneByPath = new Map(scenes.map(s => [s.filePath, s]));
    const indexOf = (s: Scene | undefined): number | undefined => {
        const v = s ? getVolumeForAct(volumes, s.act) : undefined;
        return v ? volIndex.get(v.id) : undefined;
    };

    return volumes.map(volume => {
        const n = volIndex.get(volume.id) ?? 0;
        const open: OpenSetup[] = [];
        for (const [path, payoffTitles] of links) {
            const setup = sceneByPath.get(path);
            const si = indexOf(setup);
            if (!setup || si === undefined || si > n) continue;
            const payoffs = [...payoffTitles].map(title => {
                const target = byTitle.get(title);
                const ti = indexOf(target);
                return { title, idx: ti, where: !target ? 'missing' : ti !== undefined ? chrono[ti].title : 'no volume' };
            });
            if (!payoffs.some(p => p.idx !== undefined && p.idx <= n)) {
                open.push({ setup, payoffs: payoffs.map(({ title, where }) => ({ title, where })) });
            }
        }
        open.sort((a, b) => (Number(a.setup.act) || 0) - (Number(b.setup.act) || 0) || (a.setup.sequence ?? 0) - (b.setup.sequence ?? 0));
        return { volume, open };
    });
}
