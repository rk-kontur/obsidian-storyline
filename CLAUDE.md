# StoryLine fork (rk-kontur)

Fork of PixeroJan/obsidian-storyline (MIT). Obsidian plugin in TypeScript, built with esbuild.

## Language
- **Everything in the repository is English**: code, comments, UI strings, CSS comments, workflow files, changelog, commit messages, release notes. The maintainer (Jan) must be able to read all of it.
- Conversation with the fork owner is in German.

## Branches
- `main` only mirrors `upstream/main`. No own commits, only `git merge --ff-only upstream/main`.
- Branch layout:
	- `main`: unchanged mirror of upstream.
	- `_testing`: the owner's test build with all fork changes; all BRAT releases come from here (formerly `km/base`).
	- `suggest-fix/<name>` / `suggest-feature/<name>`: one clean change each for upstream, based on `main`, without any fork scaffolding (no `km` prefixes, no CLAUDE.md, CHANGELOG-km.md or release workflow). Never create releases or tags on these branches (BRAT reads every release of the repo).
	- `various/<name>`: archived material that belongs nowhere else (e.g. `various/releases-1.12.0`, `various/corkboard-volume`).
- Pulling upstream: `git fetch upstream`, update `main`, then `git merge main` into the working branch. `rerere` is enabled.

## Manifest
- Only change `id` (`storyline-km`) and `version`. Do not touch `name` and `author`: `name` because of merge conflicts, `author` is mis-encoded upstream and must not be re-saved by an editor. Edit with `sed` or targeted edits.
- The fork must never be enabled in the same vault together with the original (`storyline`).

## Versions and releases
- Scheme `x.y.z-km.N`, where x.y.z is **always exactly the upstream version the fork is based on** (never higher than upstream).
	- `N` is one running counter for all fork releases. It only ever increases and is **never reset**, not even for a new upstream base (`1.11.8-km.14` → `1.11.8-km.15` → upstream 1.11.9 → `1.11.9-km.16`).
	- Feature branches get their own suffix and counter on top of the `_testing` release they start from: `x.y.z-km.N.<branch>.M` (e.g. `1.11.8-km.15.offpage.1`, `.2`, …). In semver this sorts after `km.15` and before `km.16`.
	- The versions `1.12.0-km.1` to `1.12.0-km.13` were released under an older scheme. Their GitHub releases were **deleted** (BRAT includes pre-releases when looking for updates, so they would always win); the git tags remain, the release assets are on branch `archive/releases-1.12.0`, the release texts in the owner's vault. **Never publish a release whose version is semver-higher than the current line**, not even as a pre-release. A BRAT install still on `1.12.0-km.*` must be switched once by hand (BRAT → edit → pick the current version).
- Release: set the version in `manifest.json`, push to `_testing`, then tag exactly this version on `_testing` (`git tag <version> && git push origin <version>`, or in the browser: Draft a new release, target `_testing`).
- `.github/workflows/release-km.yml` builds on every `*-km.*` tag, checks the tag against `manifest.json` and uploads `main.js`, `manifest.json`, `styles.css` to the release (also to an existing one).
- Without pushing a tag: start `release-km.yml` manually (workflow_dispatch) on the branch with the desired version. The workflow creates tag and release itself. This is how Claude releases from cloud sessions, which cannot push tags.
- **Every release needs a `## <version>` section in `CHANGELOG-km.md`, in English** (write it before releasing): what is new, a **How and where to use:** part with step-by-step instructions (which view or dialog, which control), and a **Files:** list of all new and changed source files. The workflow uses the section as release text for the current version only, and never overwrites a release text that was edited on GitHub (the owner adds screenshots there). It attaches `storyline-km-source.zip` and `storyline-km.patch` (diff against `main`). `CHANGELOG.md` belongs to upstream and is not touched.
- Each release also gets compare links (all changes vs. the original, and changes since the previous fork release) and `changes-since-<previous>.patch`.
- To replace the text of an existing release with its current `CHANGELOG-km.md` section (e.g. after adding screenshots there), start `.github/workflows/release-notes-km.yml` manually with the version. This overwrites edits made on GitHub, so first copy any screenshots from the release into the changelog.
- **Cosmetic plugin changes need an explicit GO from the owner.** Look/size tweaks go into the owner's Style Settings snippet, not into the plugin. If CSS cannot do it, ask first; never change plugin code for cosmetics on your own. Bundle approved plugin changes instead of many small commits.
- **Release only when the owner asks for it.** Collect fixes on `_testing` in between; BRAT only updates when the version number increases. Standing order for the code review fixes: release each feature on its own as soon as all its findings are fixed and an independent review passes.
- Test via BRAT with `rk-kontur/obsidian-storyline`.

## Scope (owner's rule)
- **Do not build by default.** Only two kinds of changes go into the fork:
	1. Fixes for problems that are noticeable and relevant.
	2. Extensions the owner explicitly wants that upstream (Jan) declined or did not take up.
- Everything else (side findings, nice-to-haves, workarounds for upstream design decisions) is only reported and proposed, never built without the owner's GO.
- Every change gets a very careful independent review, because the goal is to get all fork changes merged into StoryLine main. Prefer the smallest change to upstream code.

## Development
- Keep changes to existing files small, especially `main.ts`, `settings.ts` and `styles.css` (frequent conflict spots). New features go into new files under `views/`, `services/`, `components/`, `models/`, `utils/`. Own styles go into the clearly marked fork section at the end of `styles.css`.
- Build: `npm install`, `npm run build`. `main.js` in the repo is upstream's build and is never committed from the fork (run `git checkout main.js` after a local build); the release workflow builds `main.js` fresh. On merge conflicts in `main.js` take upstream's side.
- No `.gitignore` in the repo: never commit `node_modules/`, add files explicitly with `git add <path>`.
- Larger features should be discussed with the maintainer first and, where possible, be sent as a pull request to the original.
