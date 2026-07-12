# Liveliness plan — animations & motion (2026-07-11)

Goal: the site currently reacts to hover/press (sf-btn / sf-card / sf-link /
sf-menu-item, map pins, zoom control — shipped) but nothing *moves on its
own*, so pages feel static. This plan adds entrance, state-change, and
ambient motion in three phases.

## Guardrails (carry over from the existing motion system)

- **Transform / opacity only** for anything that animates continuously or on
  interaction — never fights the inline per-state colors, stays on the
  compositor. Background-color transitions are allowed only for the theme
  cross-fade, where the change source is a CSS variable flip.
- **Everything added goes in the existing `prefers-reduced-motion` block.**
- Durations 120–300 ms; entrance staggers ≤ 30 ms per item, capped at ~15
  items (rest appear instantly).
- CSS keyframes + classes in `globals.css`; no animation libraries.
- Entrances fire once on mount — no scroll-triggered re-animation.

## Phase 1 — Entrances (biggest "not dead" win)

1. **Staggered list reveal.** Cards fade in and rise ~12 px on first load,
   ~25 ms stagger via inline `animationDelay` keyed to render index.
   Files: `globals.css` (`@keyframes sf-rise` + `.sf-enter`),
   `ServeFremontApp.tsx` (class + delay on `ListingRow` / org headers).
2. **Map pins pop in.** Pins scale 0 → 1 with slight overshoot
   (`cubic-bezier(0.34, 1.56, 0.64, 1)`), ~20 ms stagger by org index.
   Pure CSS `animation` on the existing inner `.sf-map-pin` div (never the
   Leaflet wrapper — it owns the positioning transform).
3. **Detail view slide-in.** Opening a listing slides the panel in from the
   right (~16 px translateX + fade, 200 ms); back button reverses with a
   quick fade. File: `DetailView` root in `ServeFremontApp.tsx`.

## Phase 2 — State-change feedback

4. **Facet dropdowns** open with origin-top scale-y + fade (120 ms in / 80 ms
   out) instead of appearing instantly.
5. **Filter changes** briefly dip the list container to opacity 0.6 and back
   (150 ms) so "the list changed" reads as an event; re-stagger only the
   first few rows (≤ 15 ms) to avoid feeling slow on every click.
6. **Save (heart) pop.** Toggling scale-pulses 1 → 1.3 → 1 (~300 ms).
7. **Theme cross-fade.** `background-color/color transition (~250 ms)` on
   body + card/surface classes so dark-mode toggles melt instead of snap.
8. **Collapse chevrons rotate** 180° (150 ms) when an org section toggles.
9. **"Accepting now" dot pulse** — gentle 2 s opacity pulse on the green dot
   only (the page's single most important signal).

## Phase 3 — Ambient polish

10. **Sticky CTA bar** on the detail view slides up on entrance.
11. **Skeleton shimmer** on `loading.tsx` bars (gradient sweep) — this screen
    actually shows now during the server fetch, so it's worth polishing.
12. **Address-suggestion menu** reuses the facet dropdown animation.
13. **Map popup pop** — small scale-in on `.leaflet-popup` to match the pins.

## Explore (not committed)

- **View Transitions API** for the server-rendered `/opportunities/[id]` and
  `/orgs/[id]` navigations. Next 16 has experimental support — read
  `node_modules/next/dist/docs/` first per AGENTS.md before adopting.

## Suggested order

Phase 1 (items 1–3) is one sitting and delivers most of the perceived life.
Items 4, 6, 7, 8 are quick follow-ups. Items 5, 9–13 are polish whenever.
