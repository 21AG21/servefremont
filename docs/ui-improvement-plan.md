# UI improvement plan — memorable & functional (2026-07-12)

Goal: after the animation/liveliness pass and the map-pin/filter/locate polish,
find the next highest-leverage changes split across two axes: **memorable**
(distinctive, feels crafted, reinforces the verification moat) and
**functional** (closes real usability gaps, surfaces data that's already
collected but invisible). Grounded in a fresh audit of the running app, not
a wishlist — every item below was confirmed against the current code or a
live screenshot before being added.

## Findings that motivate this plan

- **`saved` (heart button) doesn't persist.** `DetailView` has local
  `useState(false)` for it — closing the panel or reloading loses it, and
  there's no way to see your saved list. For a student comparing options
  before committing hours, this is the single most useful missing feature.
- **`Near_School` / walkable-from-school data is collected but never shown**
  in the main app. `lib/airtable.ts` and the standalone `/opportunities/[id]`
  page use it; `lib/listings.ts` (what `ServeFremontApp` actually renders)
  drops it entirely. This directly answers the site's own "Can I get there?"
  question and the data already exists for 5 Fremont schools (American,
  Irvington, Kennedy, Mission San Jose, Washington) — it's just wiring.
- **Empty filter results is a dead end.** "No opportunities match these
  filters." is plain text with no inline way to recover; `Clear all` only
  exists up in the filter bar.
- **First paint on mobile briefly shows the desktop header.** `useIsMobile()`
  corrects via `useLayoutEffect`, but the SSR HTML (no viewport info) always
  ships the desktop layout first, so slower devices show the subtitle text
  wrap to 3 lines and squeeze the top bar for a moment. Confirmed live via a
  fresh mobile-viewport load.
- **Dark-mode toggle snaps instead of fading.** `liveliness-plan.md`
  Phase 2 item 7 already flagged this and pre-authorized a background-color
  transition as the one exception to the transform/opacity-only motion rule.
  Never implemented.
- **No results count anywhere.** Filtering silently changes the list; you
  can't tell "6 of 40 matched" vs. "there are only 6 listings total."
- **Loading skeleton is static.** `loading.tsx` shows real content on every
  cold server fetch (not just a rare edge case) but has no shimmer.

## Guardrails (carried over from liveliness-plan.md)

- Transform/opacity only for new motion, except the theme cross-fade
  (explicitly pre-approved exception, driven by a CSS variable flip).
- Everything animated respects `prefers-reduced-motion`.
- No new dependencies — plain CSS + existing hooks pattern (localStorage
  reads happen in `useEffect`/event handlers only, never during render, to
  stay hydration-safe — same pattern as `theme`/`useIsMobile`).

## Functional

1. **Persist saved opportunities.** New `lib/useSavedIds.ts` hook
   (localStorage-backed, hydration-safe). Lift `saved` out of `DetailView`'s
   local state into this hook at the `ServeFremontApp` level; pass
   `saved`/`onToggleSaved` down as props. Add a `savedOnly` flag to
   `Filters`/`EMPTY`, a filter predicate line, and a "♥ Saved (n)" toggle
   pill in the filter bar — rendered only once `n > 0` so it doesn't clutter
   a first visit.
2. **Surface walkable-from-school.** Add `walkableFrom: string[]` to
   `lib/listing.ts`, map `Near_School` in `lib/listings.ts` (`selectNames`
   helper already exists there). Add a "School" facet to `ServeFremontApp.tsx`
   (mirrors the existing `SCHEDULES` facet exactly) and a
   "Walkable from X" chip next to the existing "Near transit" chip on both
   `ListingRow` and `DetailView`.
3. **Friendlier empty-filter state.** Replace the plain "No opportunities
   match these filters." text with a short line plus an inline
   `Clear all filters` button, so recovery doesn't require scrolling back up.
4. **Fix the mobile first-paint flash.** Add a `@media (max-width: 640px)`
   rule in `globals.css` that hides the header subtitle via CSS regardless
   of `isMobile`'s JS state, so the worst symptom (3-line wrap squeezing the
   top bar) can't appear even before hydration finishes.
5. **Live results count.** Small `"{n} opportunities"` /
   `"{n} of {total} match"` label in the filter bar (desktop only — mobile's
   filter row is already tight and horizontally scrolling).

## Memorable

6. **Loading skeleton shimmer.** Add a moving gradient sweep to the
   `Bar` placeholders in `loading.tsx` — cheap, and every cold load sees it.
7. **Theme cross-fade.** ~200ms `background-color`/`color` transition on
   the root shell + surfaces when `theme` flips, so dark mode melts instead
   of snapping. Pre-authorized exception to the transform/opacity rule.
8. **Save button pop.** Toggling the heart in `DetailView` scale-pulses
   (1 → 1.3 → 1, ~250ms) instead of just recoloring — small moment of
   delight on the one interaction most tied to "I found something I like."

## Explicitly out of scope this pass

- Adding a heart button to `ListingRow` cards directly — the whole row is
  currently one `<button>`, so nesting a second interactive control means
  restructuring it (div+role vs. button) to avoid invalid nested buttons
  and needs careful `stopPropagation`. Worth a follow-up, not bundled here.
- Free-text keyword search, share-a-listing, and a stats/trust strip near
  the top were considered and cut for scope — candidates for a future pass.
- Remaining liveliness-plan.md Phase 3 items (sticky CTA entrance, map
  popup pop) are pure polish and lower-leverage than the above.

## Order

Functional 1–2 are the biggest, most mechanical (each touches 2–3 files
in one clear pattern already established elsewhere in the codebase).
3–5 and Memorable 6–8 are each small and independent — any can slot in
around the two big ones. Verify every item live (light/dark, mobile/desktop)
before moving to the next; typecheck + build at the end.
