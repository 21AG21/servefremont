# Reload-abuse protection plan (2026-07-11)

Goal: make sure one visitor — reloading on purpose, stuck in a refresh loop,
or running a bot — can't burn through the free-tier Vercel deployment's
quota or degrade the site for everyone else. Grounded in what's actually
deployed today, not a generic rate-limiting checklist: read `lib/listings.ts`,
`lib/airtable.ts`, `app/page.tsx`, `app/opportunities/[id]/page.tsx`,
`next.config.ts`, and the Next 16 caching docs in
`node_modules/next/dist/docs/01-app/` before writing this (this fork of
Next has a different caching model than stock Next — see `AGENTS.md`).

## What's already protected

- **Airtable itself is safe.** Both data loaders —
  `lib/listings.ts`'s `fetchTable()` and `lib/airtable.ts`'s opportunity
  fetch — call `fetch(..., { next: { revalidate: 60 } })`. Next's Data Cache
  dedupes this server-side, so no matter how many browsers hit the site,
  Airtable sees at most a couple of requests per 60 seconds, total. Airtable's
  real limit (5 req/s per base) has well over 100x headroom here. A reload
  storm cannot take down Airtable or trip its rate limit.
- **No separate hammerable API surface.** `app/api/listings/route.ts` was
  already removed — the homepage Server Component calls `getListings()`
  directly. There's no client-exposed JSON endpoint to script against
  separately from the page itself.

## The actual exposure

The Airtable *data* is cached, but the *page render* isn't always pinned to
that same 60s window. Checked directly against a real `next build` output
(the route summary table), not just theory:

```
Route (app)              Revalidate  Expire
┌ ○ /                            1m      1y
├ ƒ /opportunities/[id]
```

- **`/` is already fine.** It shows up as `○ Static` with a 1-minute
  revalidate — Next auto-hoists the route-level cache window from the
  `next: { revalidate: 60 }` on its `fetch()` calls, since the page reads no
  `cookies()`/`headers()`/`searchParams`. No code change needed here; this
  route already ships `Cache-Control: s-maxage=60, ...` and Vercel's edge
  will absorb a reload storm against `/` without ever reaching the origin
  function. (Confirmed against
  `node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md`.)
- **`/opportunities/[id]` is the real gap.** It's marked `ƒ Dynamic`, meaning
  every single request re-executes the origin Server Component and a
  Vercel serverless invocation — even though its own Airtable fetch is
  still cache-protected. Root cause: it has no `generateStaticParams()`, and
  per the Next docs, an unresolved dynamic `params` value without at least
  one static sample forces the route out of the static/ISR shell entirely.
  This is also the sharper edge of a reload-storm scenario, since it's
  parameterized — a script cycling through opportunity IDs generates more
  distinct origin work than one that just reloads `/`.

On a Hobby (free) plan, uncached function invocations are what actually
meters: execution (GB-hrs) and fast data transfer, plus Vercel's own
fair-use/abuse auto-mitigation, which can throttle or pause a project that
spikes hard enough. A reload loop against `/opportunities/[id]` —
accidental refresh spam, a misbehaving browser extension, or a trivial
`while(true) fetch()` script — multiplies function invocations 1:1 with
requests today.

## Plan

### 1. Give `/opportunities/[id]` the same edge-cache protection `/` already has

Add `export const revalidate = 60;` to `app/opportunities/[id]/page.tsx`.
That alone won't make it static (it still has no known param list), but it
turns it from fully dynamic into an on-demand-ISR route: the first request
for a given ID still hits the origin, but Next then caches *that rendered
page* at the edge for 60s just like `/` — so a reload storm against the
same opportunity ID (the realistic case — someone spamming refresh on one
listing they have open) becomes free cache hits after the first request
instead of metered invocations on every single one. Confirm it worked by
re-running `next build` and checking the route summary shows a
`Revalidate` column for this route instead of the bare `ƒ` it has today.

This is the single highest-leverage fix here, and it's a one-line change
directly verified against this project's real build output rather than
assumed from docs alone.

### 2. Defense-in-depth: a lightweight per-IP rate limit

Even with edge caching, a client that varies a cache-busting query param,
or catches a request right as the 60s window rolls over, still reaches the
origin. Add a small `proxy.js` (this fork's renamed middleware — see
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) that
counts requests per IP in a short sliding window (e.g. 30–60 req/min) and
returns `429` past that. Cheapest option: an in-memory `Map` in the proxy
function — resets on redeploy/cold start, which is fine, since the goal is
capping a single actor's burst, not perfect global accounting. No new
dependency required. If cross-region consistency ever matters (multi-region
deploys seeing the same abusive IP as separate counters), upgrade to a
shared store (Vercel KV / Upstash Redis both have free tiers) — not needed
at this site's current scale, so worth deferring until it actually is.

### 3. Know the manual "break glass" lever

Vercel's dashboard has an **Attack Challenge Mode** toggle (per-project,
under the Firewall/Security tab) that puts every visitor through a
bot-check page during an active incident. It's free on all plans and needs
no code — worth knowing about as a same-day response if #1 and #2 ever
turn out to be insufficient, rather than something to wire up preemptively.

## Order

Do #1 first — it's a one-line change, directly verified against this
project's real build output, and closes the actual gap (`/` already had
edge-cache protection for free; `/opportunities/[id]` didn't). #2 is worth
doing as a follow-up for defense-in-depth, but isn't urgent given #1's
coverage. #3 requires no implementation — just worth knowing it exists
before it's needed.

## Explicitly out of scope

- Third-party WAF/bot-management services (Cloudflare in front of Vercel,
  etc.) — real option if this ever outgrows Vercel's own tools, but adds a
  DNS/infra dependency not justified by current traffic.
- Per-user accounts or API keys to gate access — the whole point of the
  site is a no-login public map; auth would work against that goal.
- Aggressive caching windows longer than 60s — would drift from Airtable
  edits taking effect promptly, which matters more for a small
  actively-curated listing set than shaving a few more cache hits.
