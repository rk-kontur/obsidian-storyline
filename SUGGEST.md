# Arc Point filter and badges in Timeline and Plot Grid

## Summary
Brings the Board's and Plotlines view's Arc Point filter and badge to the Timeline, and marks Arc Points in the Plot Grid.

## What it does
The Timeline toolbar gets the same All / Scenes / Arc Points toggle as the Plotlines view (linear and swimlane mode, remembered across sessions), and Timeline cards show the "Arc Point" badge known from the Board. Acts whose scenes are only hidden by the filter are not shown as "No scenes in Act …", and a fully filtered Timeline says "No scenes match the current filter.". In the Plot Grid, Arc Point scenes get a small diamond in their mini card and row header; with the filter on "All" (the default) everything else is unchanged.

## How it works
New `components/ArcPointUI.ts` holds the toggle (same markup and CSS classes as in `StorylineView`), the badge and the diamond icon; the Timeline passes `arcAnchorFilter` to `getFilteredScenes` and stores the choice in the new setting `timelineArcFilter`. Empty acts are still decided from the unfiltered scenes, and a drag in chronological order renumbers the full scene list (the moved scene is placed next to its visible neighbours) so hidden scenes keep their order. One CSS rule for the Plot Grid icon is added next to `.scene-card-arc-point-badge`.

- Compare: https://github.com/PixeroJan/obsidian-storyline/compare/main...rk-kontur:obsidian-storyline:suggest-feature/arc-point-filter
- Code:
  - Helpers: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/components/ArcPointUI.ts#L18-L60
  - Timeline toolbar toggle: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L234-L240
  - Timeline empty acts and filter hint: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L366-L379
  - Timeline chronological drag: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L453-L461 and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L101-L132
  - Timeline swimlane empty state: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L680-L684
  - Timeline card badges: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L860 and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/TimelineView.ts#L1037
  - Plot Grid icons: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/PlotgridView.ts#L1440 and https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/views/PlotgridView.ts#L1715
  - Setting: https://github.com/rk-kontur/obsidian-storyline/blob/suggest-feature/arc-point-filter/settings.ts#L626-L627

## Needed addons
- Screenshot: Timeline (linear, Reading order) toolbar with the All / Scenes / Arc Points toggle set to **Arc Points**, showing only Arc Point cards with the "Arc Point" badge.
- Screenshot: Plot Grid with **Show linked scene cards in synced cells** on (default) after **Sync from scenes**, an Arc Point scene's mini card and its row header each showing the diamond icon.
