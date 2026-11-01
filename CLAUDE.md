# StoryLine-Fork (rk-kontur)

Fork von PixeroJan/obsidian-storyline (MIT). Obsidian-Plugin in TypeScript, Build mit esbuild. Sprache der Arbeit: Deutsch.

## Branches
- `main` ist nur ein Spiegel von `upstream/main`. Keine eigenen Commits, nur `git merge --ff-only upstream/main`.
- Eigene Arbeit liegt auf `km/base` und Feature-Branches (`feature/<name>`).
- Upstream holen: `git fetch upstream`, `main` aktualisieren, dann `git merge main` in den Arbeitsbranch. `rerere` ist aktiviert.

## Manifest
- Nur `id` (`storyline-km`) und `version` ändern. `name` und `author` nicht anfassen: `name` wegen Merge-Konflikten, `author` ist im Upstream fehlerhaft kodiert und darf nicht durch einen Editor neu gespeichert werden. Änderungen mit `sed` oder gezielt per Edit.
- Das Plugin darf im selben Vault nicht zusammen mit dem Original (`storyline`) aktiv sein.

## Versionen und Releases
- Schema `x.y.z-km.N`, wobei x.y.z die Upstream-Basis ist.
	- Fix oder Nachreichung: nur `N` erhöhen (`1.11.8-km.1` → `1.11.8-km.2`).
	- Größeres Update: Minor erhöhen und `N` auf 1 setzen (`1.11.8-km.3` → `1.12.0-km.1`).
	- Neue Upstream-Basis: x.y.z anpassen, `N` zurück auf 1.
- Release: Version in `manifest.json` setzen, auf `km/base` pushen, dann Tag mit exakt dieser Version auf `km/base` setzen (`git tag <version> && git push origin <version>`, oder im Browser Draft a new release mit Target `km/base`, Label None).
- `.github/workflows/release-km.yml` baut bei jedem Tag `*-km.*`, prüft Tag gegen `manifest.json` und lädt `main.js`, `manifest.json`, `styles.css` ans Release (auch an ein vorhandenes).
- Ohne Tag-Push: `release-km.yml` manuell starten (workflow_dispatch) auf dem Branch mit der gewünschten Version. Der Workflow legt Tag und Release selbst an. So released auch Claude aus Cloud-Sessions, die keine Tags pushen können.
- **Jedes Release braucht einen Abschnitt `## <Version>` in `CHANGELOG-km.md`, auf Englisch** (vor dem Release anlegen): Was ist neu, unter **How and where to use:** Schritt für Schritt, in welcher Ansicht/welchem Dialog man das Feature findet und bedient, unter **Files:** alle neuen und geänderten Quelldateien. Der Workflow übernimmt den Abschnitt als Release-Text (auch rückwirkend für ältere Releases) und hängt `storyline-km-source.zip` und `storyline-km.patch` (Unterschied zu `main`) an. `CHANGELOG.md` gehört dem Upstream und wird nicht angefasst.
- Test über BRAT mit `rk-kontur/obsidian-storyline`.

## Entwicklung
- Eingriffe in bestehende Dateien klein halten, vor allem `main.ts`, `settings.ts` und `styles.css` (häufige Konfliktstellen). Neue Funktionen in neuen Dateien unter `views/`, `services/`, `components/`, `models/`, `utils/`. Eigene Styles in einem klar markierten Abschnitt.
- Bauen: `npm install`, `npm run build`. `main.js` ist im Repo eingecheckt: bei Merge-Konflikten dort eine Seite nehmen und neu bauen.
- Kein `.gitignore` im Repo: `node_modules/` nie committen, Dateien gezielt mit `git add <pfad>` aufnehmen.
- Größere Features zuerst mit dem Maintainer klären und nach Möglichkeit als Pull Request an das Original schicken.
