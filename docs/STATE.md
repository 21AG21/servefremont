# ServeFremont — living state doc

Single source of truth for session continuity. **Updated after every working
message** — read this first instead of re-fetching Airtable / re-reading
files. Last updated: 2026-07-13 (Angie Schmidt replied — Shinn confirmed
and flipped Active, first reply of this batch; her volunteer-capacity
follow-up still needs Arjun's answer. Also: scheduled audit of the
then-13 Active orgs vs. live web sources — see §7a, two items need a
human call/email).

---

## 1. The goal and the gate

Launch bar (founders packet Part 0): **25+ orgs live, all verified, named
contact each** → then the **counselor pitch** (drafted in
`counselor-pitch-draft.md`, target August / first week of school, Washington
High first). The pitch is gated on the org count and an honest verification
claim — plus a real domain (a `.vercel.app` URL undercuts it).

**Current count: 14 Active / 25 needed.** 7 Paused in the pipeline (if all
convert: 21 — still 4 short; more sourcing needed even in the best case).

## 2. Must happen before the pitch (in order)

1. **Send the outreach emails** — staged in `outreach-drafts-2026-07-11.md`,
   Parts A–D. User declined to send some of the checklist batch (Don
   Edwards, Washington Hospital, Fremont Main Library, SOS MOW remain
   unsent by choice).
   **Replied → Active:** Shinn Historical Park (2026-07-13) — confirmed
   14+/hour-forms, Next_Session notes the 7/18 festival. Angie's follow-up
   (can we get volunteers there Tue 7/14 or Sat 7/18) still needs a reply —
   gated on Arjun's real-world capacity call, see §8.
   **Not yet sent:** Garin, Abode, Tri-City Free Breakfast (to Sherry Hsu),
   Mission San José, Habitat EBSV, + the Part B six.
2. **Process replies**: Internal_Notes + date → fill missing fields →
   Verification_Method + Verified_At → flip org AND opportunity Status →
   Active. Habitat: replace placeholder pin (Fremont City Hall) with real
   build-site address BEFORE flipping — never publish a wrong pin.
3. **Vercel env vars** (dashboard, not code): `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_GOATCOUNTER` (analytics fully wired in layout.tsx, off
   until set).
4. **Domain + project email** (~$12/yr) — prerequisite for the pitch email.
5. Keep sourcing orgs until 25+ is realistic (see §5 pipeline).

## 3. Done (chronological, compressed)

- **v1 app fully built** (see §6): map+list, facets, search, saved,
  detail panel, standalone ISR pages, About, self-submit → moderation
  queue, report-outdated → Reports table (48h policy), freshness decay
  (fresh/aging/stale + stale-sinks sort), sitemap/robots, SEO/OG meta,
  per-IP rate limiter (60 req/min in proxy.ts), keyboard a11y, animations,
  dark mode, mobile layout. Deployed on Vercel, auto-deploy on push to main.
- **2026-07-11 audit**: fixed two silently-broken production loops (submit
  form 502 — Submissions table didn't exist; report link went to
  placeholder mailto). Created both tables. Everything in roadmap.md.
- **2026-07-07**: fact-check pass over then-active orgs
  (`fact-check-queue-2026-07-07.md`), first outreach batch drafted.
- **2026-07-11**: Garin added (Paused); Part B verification-backlog drafts
  for 6 live-but-never-person-verified orgs.
- **2026-07-12**: Tri-City Free Breakfast unblocked — Sherry Hsu's direct
  email (sherryaohsu@yahoo.com) found via user-pasted listing; schedule
  corrected (general 6:15–9:15am / kitchen 5–9:15am); Part C rewritten to
  email her directly. Church office (office@irvingtonpres.org) is fallback.
  Then research pass added 5 new orgs (§5) + Part D drafts. Seed Library
  record data-gap fixed (Transit_Notes, Shift_Length_Hours) earlier today.
  Same day, user reviewed Part D and pushed back: Shinn's draft opened
  with an odd question about a stale 2021 COVID-vaccination requirement —
  rewritten, didn't get sent as-is (lesson saved to memory
  `feedback-email-tone`: don't lead with dated/awkward details just
  because a source mentioned them). Bountiful Blossom and Kaiser declined
  outright — "might not be easy access for the targeted demographics" —
  flipped to Declined/Archived in Airtable, not deleted.
- **2026-07-13**: scheduled audit of the then-13 Active orgs vs. live web
  sources flagged two for a human check (§7a): Tri-City Volunteers'
  Saturday shift vs. a possible weekend-closure conflict, and Tri-City
  Animal Shelter's public 18+ minimum vs. its never-person-verified
  status. Same day, Angie Schmidt replied to Shinn outreach — confirmed
  14+ age and hour-form signing. Shinn flipped Active (14th org),
  Verified_At set, Next_Session notes the 7/18 festival. Her follow-up ask
  (volunteers by Tue 7/14 or Sat 7/18) is a real-world capacity question,
  not a listing-data one — flagged to Arjun rather than answered
  automatically.

## 4. Airtable — base `appLVhrmvogCNfv1O`

Free tier. Token + base id in `.env.local` (`AIRTABLE_TOKEN`,
`AIRTABLE_BASE_ID`). Field names Title_Case_With_Underscores. **Hard
rules:** internal fields (Internal_Contact_*, Internal_Notes) never render
publicly; never hard-delete (Status flip only); nothing auto-publishes.

### Organizations `tblwy0CZCorWajhEx`
| Field | Type | Notes |
|---|---|---|
| Name | text | primary, `fldj63Locp2Bfckc6` |
| Address / Lat / Lng | text / num / num | map pin |
| Website | url | |
| Org_Type | select | Nonprofit · Government · School · Hospital · Faith-based · Institution |
| Categories | multi | Food Security · Seniors · Animals · Environment · Education · Health · Arts/History · Housing · Immigrant Services · Civic · Special Needs (new 2026-07-12) |
| Status | select | Active · Paused · Declined · Archived (`fldLkUeLFmRsmcsGg`) |
| Verified_At | date | + Verification_Method: In-Person · Email · Call · Unverified |
| Internal_Contact_name/Email/Phone | | internal only |
| Photo_Permission | checkbox | |
| Internal_Notes | multiline | `fldiG5cnvLy6KdRJW` — the audit trail |
| Opportunities | links | |

### Opportunities `tbl7PmL4mQqftALGk`
| Field | Type | Notes |
|---|---|---|
| Title | text | primary |
| Organization | link | array of org rec ids |
| Description | multiline | |
| Min_Age / Max_Age | num | |
| Guardian_Required_Number / Adults_Only | num / checkbox | |
| Schedule_Type | select | Drop-in · Shifts · Events · Flexible/Remote |
| Schedule_Notes | text | |
| Season | select | Year-round · Summer · School Year · Custom |
| Shift_Length_Hours | num | |
| Onboarding | multi | Just Show Up · Application · Email First · Orientation · Training (+2 junk options: "text", "a") |
| Onboarding_Time | text | |
| Requirements | multi | Waiver · Parent Consent · TB Test · LiveScan · Background Check |
| Cost_Notes | text | |
| Signs_Hour_Forms | select | Yes · No · Own Letter |
| Accepting | select | Yes · Waitlist · Paused |
| Group_Friendly / Group_Max | checkbox / num | |
| Transit_Notes | text | drives nearTransit facet |
| Near_School | multi | walkability facet |
| How_To_Start_UTL | url | (typo'd field name, live) |
| How_To_Start_Steps | multiline | one step/line → numbered list |
| Verified_At / Status | date / select | Active · Paused · Archived |
| Next_Session | text | shown prominently |
| Priority | checkbox | marigold star + tinted row |

### Submissions `tblSuE1DgdrjOwH7d` / Reports `tblg0WUJbhLqJ2QaU`
Moderation queues (self-submit form / report-outdated form). Nothing
auto-publishes. Reports has a 48h fix policy.

## 5. Org roster (25 records)

**Active (14):** Math Science Nucleus · Washington Township Museum ·
Kids Against Hunger · Niles Essanay Film Museum · Ohlone Humane · Afghan
Coalition · Ardenwood · Fremont Main Library · Tri-City Animal Shelter ·
SOS Meals on Wheels · Salaam Food Pantry · Age Well Center · Tri-City
Volunteers · **Shinn Historical Park & Arboretum** (Angie Schmidt,
confirmed 14+/hour-forms 2026-07-13). (~8 truly person-verified; Part B
closes the rest of the gap.)

**Paused pipeline (7):** Tri-City Free Breakfast (email Sherry directly —
strongest lead) · Garin · Abode · Don Edwards · Washington Hospital
(waitlist closed till fall 2026) · Mission San José
(mission@saintjosephmsj.org, age unknown — may be adult-only) · Habitat
EBSV (Volunteer@HabitatEBSV.org, 16+ waiver, **placeholder pin**, still
needs fixing before Active).

**Declined (3):** Coyote Hills · Bountiful Blossom (2026-07-12, user call —
accessibility fit) · Kaiser Fremont (2026-07-12, same call). **Archived
(1):** LIFE ElderCare.

## 6. Code organization (Next.js 16 App Router, TS, plain CSS)

**⚠ Next 16 is beyond training data** — read `node_modules/next/dist/docs/`
before writing Next code. Middleware is `proxy.ts`, not middleware.ts.

```
app/
  page.tsx                 → renders ServeFremontApp (main map+list SPA)
  layout.tsx               → metadata/OG defaults, GoatCounter (env-gated)
  about/ · for-organizations/ · loading · not-found
  opportunities/[id]/ · orgs/[id]/   → standalone ISR pages
                             (generateStaticParams() => [], revalidate 60)
  api/submit · api/report  → write to Airtable queues; honeypot +
                             length-cap (cap()) + rate limit
  sitemap.ts · robots.ts
components/
  ServeFremontApp.tsx (1843 ln) → nearly everything: filters, search,
      list, detail panel, dropdowns. Category facet built dynamically
      from data — new Categories values need NO code change.
  ListingMap.tsx (382)    → react-leaflet, Carto Voyager/dark_matter tiles
  OpportunityCard / FreshnessBadge / ReportOutdated / SubmitForm /
  LocateButton / InlineScript
lib/
  listings.ts             → loader for main app (via /api/listings shape)
  airtable.ts             → loader for standalone pages
      (two loaders coexist — consolidation is a known future item)
  freshness.ts            → fresh <3mo / aging 3–6 / stale >6 (decay UI)
  types.ts · listing.ts · distance.ts · useIsMobile · useSavedIds
proxy.ts                  → per-IP rate limiter, 60 req/min
app/globals.css           → --sf-* tokens, no Tailwind
```

**Layout:** desktop = filter bar on top, list sidebar left, map right,
detail slides in as a panel; mobile = list/map toggle, bottom-sheet detail.
Freshness: stale listings sink to bottom of default sort.

**Standing rules:** plain text rendering only (XSS), cookieless analytics,
no accounts, independent-project disclaimer on every page, cost ceiling
~$12–25/yr, never cut: verification badges / four questions /
report-outdated link.

## 7. Docs map

- `founders-packet.md` — the spec (Part 0 = definition of done, §3.x)
- `roadmap.md` — state vs. spec as of 2026-07-11 (superseded by this file
  for day-to-day; still the deeper writeup)
- `outreach-drafts-2026-07-11.md` — ALL current drafts, Parts A–D
- `counselor-pitch-draft.md` — the pitch, gated on 25 orgs
- `fact-check-queue-2026-07-07.md`, `outreach-drafts-2026-07-07.md`,
  `airtable-fill-plan-2026-07-07.md` — earlier passes, mostly executed
- older plan docs (liveliness, ui-improvement, abuse-protection) — shipped

## 7a. 2026-07-13 scheduled audit (all 13 Active orgs, live-web check)

Ran the `servefremont-audit` scheduled task (Airtable data vs. org
websites/Yelp/Google). Full writeup:
`~/.claude/scheduled-tasks/servefremont-audit/plan.md`. No Airtable fields
were changed — nothing found was an unambiguous correction. Two items need
a human call/email before the next outreach push:

- **Tri-City Volunteers**: org's own site shows two different phone
  numbers ((510) 598-4066 on file vs (510) 793-4583 on their /contact
  page), and independent sources say TCV is closed weekends — which
  would contradict the Saturday AM 9–12 shift Anju Sharma confirmed
  2026-06-17. Confirm the Saturday shift is real before more teens are
  routed there.
- **Tri-City Animal Shelter**: their public volunteer page states an
  18+ minimum age. This org has never been person-verified — worth
  confirming whether any role is actually teen-eligible before
  continuing outreach, per the eligibility-before-outreach rule.

Lower-priority, no action needed: Ardenwood has two legitimate phone
numbers in circulation (docent office vs. general park line) plus an
unverified possible new contact name ("Alex Kwong"); Fremont Main Library
has a findable general phone line now (not added — not a named contact);
Salaam Food Pantry's own /contact page now shows an email + phone that
weren't found on 2026-07-07 (salaamfoodpantry@gmail.com, (510) 519-7250) —
worth a verification email; Age Well Center was formerly "Fremont Senior
Center" (confirmed rename, same org).

## 8. Known loose ends

- **Arjun personally volunteering at Shinn Tue 7/14 morning** — reply to
  Angie's "can you get anyone there Tuesday" ask; he's going himself since
  the site has no other volunteer connections yet. No commitment made for
  the Sat 7/18 festival. Worth checking back after Tuesday — this could
  double as an in-person verification touchpoint (photo permission, closer
  look at the role) beyond the email-only confirmation already on file.
- **From the 2026-07-13 audit (§7a):** confirm Tri-City Volunteers'
  Saturday shift isn't affected by a possible weekend closure; confirm
  Tri-City Animal Shelter actually has a teen-eligible role given its
  public 18+ minimum.
- Uncommitted: outreach doc edits + this file (user hasn't asked to push).
- Two junk Onboarding options in Airtable schema ("text", "a") — harmless,
  cleanable someday.
- `How_To_Start_UTL` field-name typo is load-bearing (code maps it) —
  don't rename casually.
- Two data loaders (`lib/airtable.ts`, `lib/listings.ts`) — merge someday.
- Future (spec-derived): marker clustering at ~25 orgs, quarterly check-in
  tooling (Oct), monthly CSV export Action, link checker, JSON-LD, OG image.
