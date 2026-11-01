# StoryLine fork (rk-kontur)

Fork of PixeroJan/obsidian-storyline (MIT). Obsidian plugin in TypeScript, built with esbuild.

## Language
- **Everything in the repository is English**: code, comments, UI strings, CSS comments, workflow files, changelog, commit messages, release notes. The maintainer (Jan) must be able to read all of it.
- Conversation with the fork owner is in German.

## Branches
- `main` only mirrors `upstream/main`. No own commits, only `git merge --ff-only upstream/main`.
- Own work lives on `km/base` and feature branches (`feature/<name>`).
- Pulling upstream: `git fetch upstream`, update `main`, then `git merge main` into the working branch. `rerere` is enabled.

## Manifest
- Only change `id` (`storyline-km`) and `version`. Do not touch `name` and `author`: `name` because of merge conflicts, `author` is mis-encoded upstream and must not be re-saved by an editor. Edit with `sed` or targeted edits.
- The fork must never be enabled in the same vault together with the original (`storyline`).

## Versions and releases
- Scheme `x.y.z-km.N`, where x.y.z is **always exactly the upstream version the fork is based on** (never higher than upstream).
	- `N` is one running counter for all fork releases. It only ever increases and is **never reset**, not even for a new upstream base (`1.11.8-km.14` → `1.11.8-km.15` → upstream 1.11.9 → `1.11.9-km.16`).
	- Feature branches get their own suffix and counter on top of the `km/base` release they start from: `x.y.z-km.N.<branch>.M` (e.g. `1.11.8-km.15.offpage.1`, `.2`, …). In semver this sorts after `km.15` and before `km.16`.
	- The versions `1.12.0-km.1` to `1.12.0-km.13` were released under an older scheme. Since `1.11.8-km.14` the version follows upstream again. BRAT only updates to a higher version, so a BRAT install on `1.12.0-km.*` must be switched once by hand.
- Release: set the version in `manifest.json`, push to `km/base`, then tag exactly this version on `km/base` (`git tag <version> && git push origin <version>`, or in the browser: Draft a new release, target `km/base`).
- `.github/workflows/release-km.yml` builds on every `*-km.*` tag, checks the tag against `manifest.json` and uploads `main.js`, `manifest.json`, `styles.css` to the release (also to an existing one).
- Without pushing a tag: start `release-km.yml` manually (workflow_dispatch) on the branch with the desired version. The workflow creates tag and release itself. This is how Claude releases from cloud sessions, which cannot push tags.
- **Every release needs a `## <version>` section in `CHANGELOG-km.md`, in English** (write it before releasing): what is new, a **How and where to use:** part with step-by-step instructions (which view or dialog, which control), and a **Files:** list of all new and changed source files. The workflow uses the section as release text for the current version only, and never overwrites a release text that was edited on GitHub (the owner adds screenshots there). It attaches `storyline-km-source.zip` and `storyline-km.patch` (diff against `main`). `CHANGELOG.md` belongs to upstream and is not touched.
- Each release also gets compare links (all changes vs. the original, and changes since the previous fork release) and `changes-since-<previous>.patch`.
- **Cosmetic plugin changes need an explicit GO from the owner.** Look/size tweaks go into the owner's Style Settings snippet, not into the plugin. If CSS cannot do it, ask first; never change plugin code for cosmetics on your own. Bundle approved plugin changes instead of many small commits.
- **Release only when the owner asks for it.** Collect fixes on `km/base` in between; BRAT only updates when the version number increases. Standing order for the code review fixes: release each feature on its own as soon as all its findings are fixed and an independent review passes.
- Test via BRAT with `rk-kontur/obsidian-storyline`.

## Development
- Keep changes to existing files small, especially `main.ts`, `settings.ts` and `styles.css` (frequent conflict spots). New features go into new files under `views/`, `services/`, `components/`, `models/`, `utils/`. Own styles go into the clearly marked fork section at the end of `styles.css`.
- Build: `npm install`, `npm run build`. `main.js` is checked in: on merge conflicts take one side and rebuild.
- No `.gitignore` in the repo: never commit `node_modules/`, add files explicitly with `git add <path>`.
- Larger features should be discussed with the maintainer first and, where possible, be sent as a pull request to the original.
