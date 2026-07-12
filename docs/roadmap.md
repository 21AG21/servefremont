# ServeFremont roadmap — state of the project (2026-07-11)

One place to see where the project stands against its own spec
(`founders-packet.md`), what just changed, and what's left — past, present,
future. Supersedes the completed plan docs (`liveliness-plan.md`,
`ui-improvement-plan.md` — both fully shipped; `abuse-protection-plan.md`
items #1–2 shipped, #3 needs no code).

## Scorecard vs. the definition of done (founders packet, Part 0)

| v1 bar | Status |
|---|---|
| 25+ orgs live, all verified, named contact each | **13 Active**, of which ~7 truly person-verified. Outreach checklist covers the gap — biggest open item, and it's email-sending, not code. |
| Map + list with filters answering the four questions | ✅ Shipped, including school-walkability + saved + search |
| Freshness system that keeps data alive | ✅ Logic + decay UI shipped (see below); the *human* quarterly loop starts October |
| Counselors at 2+ schools linking to it | Drafted, gated on the 25-org bar (`counselor-pitch-draft.md`) |
| Build journal | Partial — commit history is detailed, but no student-written journal entries |

## Fixed in the 2026-07-11 full audit (this pass)

Two things were **silently broken in production**, found by checking every
spec loop end-to-end:

- **The org self-submit form never worked.** `/api/submit` writes to a
  `Submissions` Airtable table that didn't exist — every real submission got
  a 502. Table created (`tblSuE1DgdrjOwH7d`); the existing code needed no
  changes and now works.
- **"Report outdated info" went nowhere.** The standalone page mailto'd
  `hello@servefremont.example` (a placeholder domain); the in-app link went
  to a Google Form. Both replaced with an in-house form → `/api/report` →
  new `Reports` table (`tblg0WUJbhLqJ2QaU`), honeypot + rate-limited +
  length-capped, tested end-to-end against real Airtable. Better privacy
  posture than Google Forms for a minors-focused site, and reports land in
  the same base as everything else. 48-hour fix policy is now real.

Also shipped in the same pass:

- **Keyboard accessibility** (spec quality floor, was entirely missing):
  global `:focus-visible` outline; Escape closes the open dropdown, then the
  detail panel.
- **Freshness decay in the main app** (spec §3.7): fresh = green
  "Verified Jun 2026", 3–6mo = neutral "Last verified", >6mo = warning
  "Unconfirmed — check with the org" and the listing sinks to the bottom of
  the default sort. Invisible today (all data is fresh) — the point is it
  degrades honestly without anyone remembering to flip a switch.
- **Client-side search** (spec §3.3 #8) across title / org / cause, in the
  filter bar on both layouts.
- **SEO/meta**: `metadataBase` + OpenGraph/Twitter defaults, mobile
  `themeColor`, sitemap cached 1h instead of regenerating per crawler hit.
- **Hardening**: length caps on both write APIs; `.claude/` gitignored.

## Config the site is waiting on (dashboard, not code)

1. **`NEXT_PUBLIC_SITE_URL`** env var in Vercel — sitemap + OG URLs
   currently fall back to `servefremont.vercel.app`, which is fine until the
   real domain exists, then this is a one-line change.
2. **`NEXT_PUBLIC_GOATCOUNTER`** env var — cookieless analytics are fully
   wired in `layout.tsx` and OFF until this is set. Create the (free)
   GoatCounter account, set the site code, redeploy. This is a launch-bar
   item (spec 3.9).
3. **Domain + project email** (~$12/yr, spec 3.5) — needed before the
   counselor pitch; the About/report/submit loops all work without it, but
   a `.vercel.app` URL in a counselor email undercuts the pitch.

## Near-term (highest value next, in order)

1. **Send the outreach emails** — the checklist artifact has all 11
   ready to paste. Nothing else moves the 13→25 needle.
2. **Process replies** per the loop: notes → fields → Verification_Method +
   Verified_At → flip Active.
3. **Set the two env vars** above; buy the domain when ready.
4. **Fact-check pass on the remaining "Active but never person-verified"
   orgs** as replies come in (tracked in the checklist).
5. **Counselor pitch in August** (first week of school), only once the
   listing count and verification claim are honest — Washington High first.

## Future (roadmap, spec-derived)

- **Marker clustering (T-1)** — needed around 25+ orgs when pins overlap;
  `leaflet.markercluster` or supercluster.
- **Quarterly check-in tooling (§3.7)** — October is the first cycle. A
  simple script that drafts the 60-second check-in email per org from
  Airtable would make the 2-hour loop real.
- **Monthly Airtable CSV export into the repo (T-10)** — GitHub Action on a
  cron + `AIRTABLE_TOKEN` repo secret. Protects against the free tier's
  1,000-record cap surprise and gives history.
- **Quarterly link checker (T-7)** — same Action can hit every
  `How_To_Start_Url` and flag non-200s.
- **JSON-LD structured data** on opportunity pages (schema.org
  `VolunteerAction`/`Event`) — SEO for "volunteer fremont teens" queries.
- **OG image** — a branded card for link sharing (counselor → student
  group-chats is exactly where OG images matter).
- **Data-loader consolidation** — `lib/airtable.ts` (standalone pages) and
  `lib/listings.ts` (main app) both fetch the same tables with different
  shapes. Merge into one loader with two mappers when convenient; not
  urgent, they're both stable.
- **v2 parking lot** (spec §3.10, unchanged): hour-log PDF generator, org
  self-service edits, email digest, multilingual UI, school-specific
  embeddable views, Congressional App Challenge demo video (~Nov).

## Standing rules (unchanged, for any future session)

- Internal contact fields and notes never render publicly.
- Nothing auto-publishes — Submissions and Reports are moderation queues.
- Never hard-delete orgs/opportunities — archive via Status.
- No accounts, no cookies, no student data.
- Verification claims on the site must match reality in Airtable.
