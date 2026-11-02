import type { Scene } from '../models/Scene';

/**
 * Characters of a scene, including its POV character.
 *
 * Like getAllCharacters(), names are compared case-insensitively. `pov` and
 * `characters` are already cleaned by MetadataParser (no [[ ]], alias or path).
 */

function characterKey(name: string): string {
    return String(name || '').trim().toLowerCase();
}

/** `characters` plus `pov`, without duplicates (first spelling wins). */
export function sceneCharacterNames(scene: Pick<Scene, 'characters' | 'pov'>): string[] {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const name of [...(scene.characters ?? []), ...(scene.pov ? [scene.pov] : [])]) {
        const key = characterKey(name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        names.push(String(name).trim());
    }
    return names;
}

/** True if any of `wanted` is a character of the scene (POV included). */
export function sceneHasAnyCharacter(scene: Pick<Scene, 'characters' | 'pov'>, wanted: string[]): boolean {
    const keys = new Set(sceneCharacterNames(scene).map(characterKey));
    return wanted.some(name => keys.has(characterKey(name)));
}
