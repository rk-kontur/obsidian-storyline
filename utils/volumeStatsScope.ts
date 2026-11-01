// ═══════════════════════════════════════════════════════
//  Statistics scope: one volume or all volumes (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The Statistics view follows the shared volume selector:
//   - a volume is selected  → every section counts only that volume's acts;
//                             word goal and deadline come from the volume.
//   - "All volumes"         → every section counts the whole project; the
//                             word goal is the sum of the volume goals and
//                             the deadline is the latest volume deadline,
//                             unless a project deadline is set.
// Without `volumes:` nothing changes.

import type { App } from 'obsidian';
import { getProjectVolumes, type VolumeDef } from './volumes';
import { getScopedVolume } from './volumeScope';

export interface StatsScope {
    volumes: VolumeDef[];
    /** Selected volume, undefined = all volumes / no volumes. */
    volume?: VolumeDef;
}

export function getStatsScope(app: App, projectFilePath: string | undefined | null): StatsScope {
    const volumes = getProjectVolumes(app, projectFilePath);
    return { volumes, volume: volumes.length ? getScopedVolume(app, projectFilePath) : undefined };
}

/** Heading of the Statistics view. */
export function statsHeading(scope: StatsScope): string {
    if (scope.volume) return `${scope.volume.title} statistics`;
    return scope.volumes.length ? 'Project statistics (all volumes)' : 'Project statistics';
}

/** Sum of all volume word goals, or undefined if no volume has a goal. */
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
 * Word goal for the overview.
 * Volume: its wordGoal, else the scene targets of the volume, else the project goal.
 * All volumes: sum of volume goals, else the project goal.
 */
export function scopedWordGoal(scope: StatsScope, projectGoal: number | undefined, sceneTargets: number): number | undefined {
    if (scope.volume) return scope.volume.wordGoal || sceneTargets || projectGoal;
    return totalVolumeGoal(scope.volumes) ?? projectGoal;
}

/**
 * Deadline for the overview.
 * Volume: its deadline, else the project deadline.
 * All volumes: the project deadline, else the latest volume deadline.
 */
export function scopedDeadline<T extends { deadline: string | null | undefined }>(scope: StatsScope, project: T): T {
    if (scope.volume) return scope.volume.deadline ? { ...project, deadline: scope.volume.deadline } : project;
    if (!project.deadline) {
        const latest = latestVolumeDeadline(scope.volumes);
        if (latest) return { ...project, deadline: latest };
    }
    return project;
}
