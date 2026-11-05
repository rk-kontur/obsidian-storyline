# Changelog: Android UI test build

## 1.11.8-km.34

**Test build: Android UI fixes only. Not a regular release.**

This build is the original StoryLine 1.11.8 by Jan Sandström plus Android UI fixes only. None of the other fork changes (volumes, Arc Points, off page, plotline colours …) are included. It exists to test the fixes on phones before they go to Jan and into the fork.

- **New: StoryLine below the status bar on phones, portrait and landscape.** In portrait the toolbar slid under the Android status bar; in landscape a large empty gap appeared above StoryLine. The toolbar now sits directly below the status bar in both orientations. Tablets are unchanged.
- **From 1.11.8-km.33: Manuscript toolbar on phones.** The toolbar and filter bar keep their full height in the Manuscript.

Test with the CSS snippet's "Keep StoryLine below the status bar" switched off.

**To go back to the full fork,** install the next regular fork release.

## 1.11.8-km.33

**Test build: Android UI fixes only. Not a regular release.**

This build is the original StoryLine 1.11.8 by Jan Sandström plus Android UI fixes only. None of the other fork changes (volumes, Arc Points, off page, plotline colours …) are included. It exists to test the fixes on phones before they go to Jan and into the fork.

- **Manuscript toolbar on phones:** on phones the Manuscript squeezed the toolbar to a few pixels, so the view switcher slid behind the filter bar. The toolbar and filter bar now keep their full height. Fix branch for Jan: `suggest-fix/manuscript-phone-toolbar`.

**To go back to the full fork,** install the next regular fork release.
