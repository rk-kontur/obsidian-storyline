// ═══════════════════════════════════════════════════════
//  Characters of a scene, including the POV character (fork: storyline-km)
// ═══════════════════════════════════════════════════════
//
// The POV character is part of the scene. Character View, Statistics, the
// Validator and the scene cards already count `pov` together with
// `characters`; this helper lets the remaining places (character filter,
// Timeline swimlanes "By Character") do the same, so a POV character does
// not have to be entered twice.

import type { Scene } from '../models/Scene';

/** "[[Path/Name|Alias]]" → "name" (for comparisons only). */
export function characterKey(value: string): string {
    let v = String(value || '').trim();
    const m = v.match(/^\[\[(.*)\]\]$/);
    if (m) v = m[1];
    v = v.split('|')[0].split('/').pop() || v;
    return v.replace(/\.md$/i, '').trim().toLowerCase();
}

/** `characters` plus `pov`, without duplicates (first spelling wins). */
export function sceneCharacterNames(scene: Pick<Scene, 'characters' | 'pov'>): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const name of [...(scene.characters ?? []), ...(scene.pov ? [scene.pov] : [])]) {
        const key = characterKey(name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(String(name).trim());
    }
    return out;
}

/** True if any of `wanted` is a character of the scene (POV included). */
export function sceneHasAnyCharacter(scene: Pick<Scene, 'characters' | 'pov'>, wanted: string[]): boolean {
    const keys = new Set(sceneCharacterNames(scene).map(characterKey));
    return wanted.some(w => keys.has(characterKey(w)));
}
