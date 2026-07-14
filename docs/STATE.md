# ServeFremont — living state doc

Single source of truth for session continuity. **Updated after every working
message** — read this first instead of re-fetching Airtable / re-reading
files. Last updated: 2026-07-14 (fixed the Forms dropdown rendering
INVISIBLY BEHIND the map — Leaflet pane z-indexes (200–1000) leaked into
the root stacking context and beat the menu (50) + click-away layer (40);
one-line fix: `isolation: "isolate"` on the map wrapper in
ServeFremontApp.tsx. User-reported; last session's "screenshot artifact"
dismissal of the clipped-menu screenshot was wrong — the screenshot was
showing this bug. Uncommitted. Earlier today: added a header "Forms" dropdown —
pick your school, get its hour-verification form; only Washington has a
real PDF on file, other 4 schools show "Coming soon" honestly rather
than link to the wrong one. Also fixed a mobile header overflow this
introduced — see §6/§8. Pushed, commit 27d1a35. Earlier: added a service-hour-form
download to the About page + a "bring your own form" step on Shinn's
listing, first real code change since the 2026-07-11 audit (that one's
pushed, commit ddfa771). Also: Shinn upgraded to In-Person verified —
confirmed today's listing
update (email-only onboarding, Tuesdays 10am-noon, various roles,
template email) came from Arjun actually volunteering on-site, not a
follow-up email. Strongest verification tier in the roster now. Photo
permission still unasked, see §8. Prior day, 2026-07-13: Jennifer MacRae
replied re:
Masonic Homes — 14+/hour-forms confirmed, but held at Paused since it
still has no real map pin. Parent asked for a bigger outreach backlog
since the son sends ~5 emails/day — added 4 more orgs + 3 more drafts,
Part F; Angie Schmidt replied — Shinn confirmed and flipped Active;
Salaam's Part E got corrected after user pushback; a
scheduled audit flagged two orgs needing a human check, see §7a).

---

## 1. The goal and the gate

Launch bar (founders packet Part 0): **25+ orgs live, all verified, named
contact each** → then the **counselor pitch** (drafted in
`counselor-pitch-draft.md`, target August / first week of school, Washington
High first). The pitch is gated on the org count and an honest verification
claim — plus a real domain (a `.vercel.app` URL undercuts it).

**Current count: 14 Active / 25 needed.** 11 Paused in the pipeline (if
all convert: 25 — hits the bar exactly, so there's now no real slack for
any pipeline org to fall through without more sourcing).

## 2. Must happen before the pitch (in order)

1. **Send the outreach emails** — staged in `outreach-drafts-2026-07-11.md`,
   Parts A–F (11 emails, ~13 orgs, ready to send — plenty for 5/day). User
   declined to send some of the checklist batch (Don Edwards, Washington
   Hospital, Fremont Main Library, SOS MOW remain unsent by choice).
   **Replied → Active:** Shinn Historical Park (2026-07-13) — confirmed
   14+/hour-forms, Next_Session notes the 7/18 festival. Angie's follow-up
   (can we get volunteers there Tue 7/14 or Sat 7/18) still needs a reply —
   gated on Arjun's real-world capacity call, see §8.
   **Replied, held at Paused (not Active):** Masonic Homes Union City
   (2026-07-13) — Jennifer confirmed 14+/hour-forms, but no real Lat/Lng
   exists yet, same never-publish-a-wrong-pin rule as Habitat. Also: she
   replied from jtriana@mhcuc.org, not the jmacrae@mhcuc.org published on
   their site — Internal_Contact_Email corrected to match.
   **Not yet sent:** Garin, Abode, Tri-City Free Breakfast (to Sherry Hsu),
   Mission San José, Habitat EBSV, Salaam Food Pantry (Part E), League of
   Volunteers, Mission Peak + Quarry Lakes (Part F, one combined email),
   + the Part B six.
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
  automatically. Also: drafted a Salaam Food Pantry verification email
  (Part E) around the named contact found in the audit — user pushed
  back, wanted age/hour-forms asked instead. Re-checked
  salaamfoodpantry.org/volunteer directly and found the site states
  neither; both had been filled into Airtable as unconfirmed guesses
  during the original 2026-06-22 sourcing pass (Signs_Hour_Forms showed
  "Yes" live on the site with no real basis). Cleared Signs_Hour_Forms
  back to blank on both opportunities and rewrote Part E to ask age and
  hour-forms directly. Same day: parent said the son should be sending
  ~5 emails/day and asked for more — added 4 more orgs (Masonic Homes
  Union City, League of Volunteers, Mission Peak, Quarry Lakes) and 3
  more drafts (Part F; the two EBRPD parks share one email, same inbox).
  Applied the Salaam lesson throughout: age/hour-forms asked directly
  wherever not literally stated on the org's own site, nothing
  paraphrased in as fact. One candidate (Niles Canyon Railway) found but
  not drafted — no verifiable direct contact, noted in Part F instead.
  Same day, Jennifer MacRae replied re: Masonic Homes — confirmed 14+ and
  hour-form signing, both real answers this time (unlike Salaam). Held at
  Paused rather than flipping Active, because Lat/Lng was never geocoded
  (address is correct, just no coordinates) — same rule applied to
  Habitat. Also caught a contact-info drift: she replied from
  jtriana@mhcuc.org, not the jmacrae@mhcuc.org published on their own
  site — corrected Internal_Contact_Email to the address that's proven
  to actually work.

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

## 5. Org roster (29 records)

**Active (14):** Math Science Nucleus · Washington Township Museum ·
Kids Against Hunger · Niles Essanay Film Museum · Ohlone Humane · Afghan
Coalition · Ardenwood · Fremont Main Library · Tri-City Animal Shelter ·
SOS Meals on Wheels · Salaam Food Pantry · Age Well Center · Tri-City
Volunteers · **Shinn Historical Park & Arboretum** (Angie Schmidt,
**In-Person verified 2026-07-14** — Arjun volunteered on-site, the
strongest tier in the roster; just email her, Tuesdays 10am-noon, various
roles, template email on file; photo permission still unasked). (~8 truly
person-verified — Shinn was already one, just upgraded tiers; Part B
closes the rest of the gap.)

**Paused pipeline (11):** Tri-City Free Breakfast (email Sherry directly —
strongest lead) · Garin · Abode · Don Edwards · Washington Hospital
(waitlist closed till fall 2026) · Mission San José
(mission@saintjosephmsj.org, age unknown — may be adult-only) · Habitat
EBSV (Volunteer@HabitatEBSV.org, 16+ waiver, **placeholder pin**, still
needs fixing before Active) · **new 2026-07-13:** Masonic Homes Union
City (**14+/hour-forms CONFIRMED** by Jennifer MacRae, real address is
jtriana@mhcuc.org not the jmacrae@ published on their site — only
blocker left is Lat/Lng, never geocoded; this is the closest org in the
whole pipeline to Active, just needs coordinates) · League of Volunteers
(lov@lov.org, teen program confirmed
13-17, **same no-Lat/Lng gap**) · Mission Peak Regional Preserve + Quarry
Lakes Regional Recreation Area (both volunteers@ebparks.org, one combined
email — these two DO have coordinates already, sourced from a trail
guide and Wikipedia respectively, good enough to trust but worth a
sanity-check before Active).

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
      about/page.tsx now has a callout card linking to
      /community-service-hours-form.pdf (2026-07-14) — it's Washington
      High's own form, labeled as such; other schools need their own.
  opportunities/[id]/ · orgs/[id]/   → standalone ISR pages
                             (generateStaticParams() => [], revalidate 60)
  api/submit · api/report  → write to Airtable queues; honeypot +
                             length-cap (cap()) + rate limit
  sitemap.ts · robots.ts
components/
  ServeFremontApp.tsx (1843 ln) → nearly everything: filters, search,
      list, detail panel, dropdowns. Category facet built dynamically
      from data — new Categories values need NO code change.
      2026-07-14: added a "Forms" header dropdown (left of About), reuses
      the openFacet/menuPos facet-menu machinery. SCHOOL_FORMS maps each
      SCHOOLS entry to a form URL or null ("Coming soon") — only
      Washington has a real file. Adding a school's form later is a
      one-line change. Also made the header button row `.filter-scroll`
      (+ minWidth:0/flexShrink:1) since 4 buttons no longer fit on
      mobile without it — same horizontal-scroll pattern the filter row
      already used. Later on 2026-07-14: map wrapper got
      `isolation:"isolate"` — Leaflet's internal z-indexes (tiles 200 …
      controls 1000) otherwise escape into the root stacking context and
      paint over the app's fixed dropdown (z 50) and click-away overlay
      (z 40). Filter menus never showed it (they drop over the list, not
      the map); the header Forms menu drops onto the map and was fully
      hidden. Any future fixed/floating UI stays safe as long as that
      isolation stays on the map wrapper.
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
public/                   → static assets; now also
                             community-service-hours-form.pdf
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
- `outreach-drafts-2026-07-11.md` — ALL current drafts, Parts A–F
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

## 7b. 2026-07-14 scheduled audit (all 14 Active orgs, follow-up pass)

Ran `servefremont-audit` again. Full writeup:
`~/.claude/scheduled-tasks/servefremont-audit/plan.md`. No Airtable changes
— nothing surfaced was an unambiguous fix.

- **Tri-City Volunteers — escalated.** Second consecutive day independent
  web sources report TCV closed Saturdays/Sundays and use phone (510)
  793-4583, contradicting the on-file Saturday AM 9–12 shift (confirmed by
  Anju Sharma 2026-06-17) and phone (510) 598-4066. Recommend an actual
  call/email to Anju before routing more teens to a Saturday shift.
- **Tri-City Animal Shelter — resolved, no action needed.** Confirmed the
  public 18+ minimum applies only to in-shelter volunteering; Airtable
  already correctly separates that from the all-ages "Community Service
  Hours Projects (From Home)" opportunity (no Min_Age set). Yesterday's
  flag was based on not yet having checked how the record was modeled —
  it turns out fine as-is.
- **Shinn Historical Park & Arboretum** (added Active 2026-07-13, too late
  for that day's audit): checked against public sources today — phone,
  age (14+), and Tuesday 10am-noon schedule all match what's on file.
  Nothing to change.
- No new Fremont-area nonprofit closures found affecting any org on the
  roster.

## 8. Known loose ends

- **Need 4 more schools' hour forms**: American, Irvington, Kennedy,
  Mission San Jose all show "Coming soon" in the new Forms picker — only
  Washington's is on file. Get each from that school's counseling/service
  office (they're usually not published online), then add the file to
  `public/` and flip its `SCHOOL_FORMS` entry in ServeFremontApp.tsx from
  `null` to the path. Don't substitute Washington's or any other school's
  form for a different school — wrong drop-box/coordinator, hours won't
  get counted.
- **Masonic Homes needs ONE thing: real Lat/Lng.** Everything else is
  done — 14+/hour-forms confirmed by Jennifer MacRae 2026-07-13, contact
  corrected to jtriana@mhcuc.org. Address (34400 Mission Blvd, Union
  City, CA 94587) is correct, just never successfully geocoded — a quick
  Google Maps lookup would unblock flipping both org (`recqYS2yLv7hwQC0S`)
  and opportunity (`recLWorgiFbgCsTLm`) to Active. Cheapest win available
  right now.
- **Shinn photo permission** — confirmed 2026-07-14 the listing update
  came from Arjun's in-person visit, so Verification_Method is now
  In-Person (upgraded from Email, `recBaWMkzyZuSvbtA`). One thing not yet
  asked while he was there: `Photo_Permission` checkbox is still unset —
  worth a quick follow-up with Angie if he goes back, otherwise low
  priority.
- **Tri-City Volunteers — escalated (§7b).** Two consecutive daily audits
  (7/13, 7/14) contradict the on-file Saturday AM 9–12 shift and phone
  number. Actually call/email Anju Sharma before routing more teens there.
  (Tri-City Animal Shelter's 18+ question from the 7/13 audit is resolved
  — the from-home project is correctly modeled with no age floor.)
- **Dev server "stale" runtime errors** (Runtime SyntaxError / can't find
  global-error.js module) — not a real bug, just a stale `.next` Turbopack
  cache after `@vercel/analytics` was added. Fix: `rm -rf .next`, restart
  the dev server. Hit and fixed 2026-07-14.
- **Niles Canyon Railway** (Pacific Locomotive Association, Niles) — real
  org, 15+ open volunteer positions, but no verifiable direct email, only
  a contact form + general phone (510-996-8420). Not in Airtable, not
  drafted. Worth a phone call, or revisit if an email surfaces.
- Two junk Onboarding options in Airtable schema ("text", "a") — harmless,
  cleanable someday.
- `How_To_Start_UTL` field-name typo is load-bearing (code maps it) —
  don't rename casually.
- Two data loaders (`lib/airtable.ts`, `lib/listings.ts`) — merge someday.
- Future (spec-derived): marker clustering at ~25 orgs, quarterly check-in
  tooling (Oct), monthly CSV export Action, link checker, JSON-LD, OG image.
