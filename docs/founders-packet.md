# ServeFremont — Founder's Packet

> The pitch, the visit kit, and the full product spec for a verified map of every volunteer opportunity in Fremont. Working name "ServeFremont" — renaming is Decision #1 (Part 5). Everything here is a strong default, not a rule; record deliberate changes and why.

This is the project's source-of-truth spec. The engineering sections (Part 3) drive the build; Parts 1, 2, 4 are field material for in-person visits.

---

## Part 0: Read this first

**Mission (one sentence):** Any student in Fremont can find a legitimate, age-eligible, currently-active volunteer opportunity they can actually get to — in under two minutes.

**Why it doesn't exist yet:** Info is scattered across FUSD pages, counselor lists, the city site, the library portal, and ~30 nonprofit sites — mostly stale. National platforms (VolunteerMatch, JustServe) aren't Fremont-specific, student-specific, or verified. The edge is not the website; it's that **every listing is verified by a human who walked in the door**.

**The one rule:** The student builds it. Designs the data model, directs the work, reviews every change, can explain every part out loud.

**Definition of done for v1 (end of summer):**
1. 25+ organizations live, every one verified in person, each with a named contact
2. Map + list with filters answering the four real questions
3. A freshness system that keeps data alive after launch
4. Counselors/club advisers at 2+ FUSD high schools linking to it
5. A build journal proving understanding of what shipped

---

## Part 3: The Product Spec

### 3.1 Users, jobs, non-goals

**Primary user:** A Fremont high schooler, on a phone, often without a car, needs service hours, ~10 min patience. Questions in order: *Am I old enough? · Can I get there? · Can I start without a 3-week application? · Will they sign my hour form?* Every design decision serves these four.

**Secondary:** parents of younger teens; counselors/CSF/NHS advisers; org coordinators.

**Non-goals for v1:**
- ❌ No user accounts, logins, saved favorites
- ❌ No hour tracking (v2 maybe)
- ❌ No reviews or ratings
- ❌ No in-site messaging (link out to org's own process)
- ❌ No native app (a fast mobile website is the app)

### 3.2 Data model

Two entities. Key decision: **an Organization has many Opportunities.** Different roles = different rows (different ages/schedules). Never flatten them.

**Organization**
| field | type | notes |
|---|---|---|
| id | string | stable slug, e.g. `tri-city-volunteers` |
| name, mission, website | string | mission in org's own words |
| org_type | enum | nonprofit · government · school · hospital · faith_based · institution |
| categories | enum[] | the 10 categories from intake |
| address, lat, lng | string, float | lat/lng captured at the front door during the visit |
| contact_name, contact_email, contact_phone | string | **never rendered publicly** — internal only |
| photo_url, logo_url, photo_permission | string, bool | publish only if permission checked |
| status | enum | active · paused · archived · declined |
| verified_at, verification_method | date, enum | in_person · email · unverified |
| internal_notes | text | never rendered |

**Opportunity**
| field | type | notes |
|---|---|---|
| id, org_id | string | |
| title, description | string | description ≤ 60 words, for a 15-year-old, active voice |
| min_age, guardian_required_under, adults_only | int, int, bool | |
| schedule_type | enum | drop_in · shifts · events · flexible_remote |
| schedule_structured | json | days/times where regular |
| schedule_notes | string | free text ("2nd Saturdays") |
| season | enum | year_round · summer · school_year · custom |
| event_date | date? | one-time only; **auto-hide when past** |
| min_commitment, shift_length_hours | string, float | |
| onboarding | enum[] | show_up · application · email_first · orientation · training |
| onboarding_time | string | "~2 weeks from signup to first shift" |
| requirements | enum[] | waiver · parent_consent · tb_test · livescan · background_check |
| cost_notes | string? | fees stated plainly |
| signs_hour_forms | enum | yes · no · own_letter |
| accepting | enum | yes · waitlist · paused |
| group_friendly, group_max | bool, int? | |
| languages | string[]? | |
| transit_notes, walkable_from | string, enum[] | AC Transit line/stop; American · Irvington · Kennedy · MSJ · Washington |
| location_type | enum | at_org · varies · remote |
| how_to_start_url | string | deep link to *their* signup, not homepage |
| verified_at | date | inherits from org visit, can update independently |

### 3.3 Pages & features (v1 surface)

1. **Home = map + list.** Desktop: map left, synced cards right. Mobile: list first with a "Map" toggle — *list is primary*, map is delight. Cards: title, org, distance info, age badge, "signs hour forms ✓", freshness badge.
2. **Filters (the product):** age chips ("I am 14/15/16/17/18") · category · "open to new volunteers now" · "no application — just show up" · "signs school hour forms" · "one-time friendly" · "group/club friendly" · "near my school" (five-school chips) · "transit accessible." Default: accepting=yes, sorted by most recently verified.
3. **Opportunity page** (money page, server-rendered for SEO): four questions above the fold, "How to start" as one obvious button, freshness badge w/ date, "Report outdated info" link.
4. **Organization page:** mission, photo, all its opportunities, map pin.
5. **About:** story, verification promise, inclusion policy, disclaimer (S-1). Written for counselors too.
6. **For Organizations:** pitch + self-submit form → moderation queue. **Nothing auto-publishes, ever.**
7. **Report outdated info:** one-tap link on every listing → form → email → 48h fix policy.
8. **Search:** client-side text match across titles/orgs/categories.

### 3.4 Design direction

Personality: **a field guide crossed with a transit map** — civic, warm, trustworthy, fast.

- **Signature element: the verification stamp.** "✓ Verified by a visit · May 2026", almost rubber-stamped. The one design flourish; keep everything else quiet.
- **Palette:** deep park-and-refuge green (primary actions), warm off-white bg, charcoal text, one warm accent (marigold) reserved for the verification stamp + age badges. 4–5 colors total.
- **Type:** one characterful display face used sparingly (Archivo or Fraunces), one quiet body face (Inter or Source Sans), generous sizes.
- **Mobile-first, thumb-first:** filters as tappable chips not dropdowns; big tap targets.
- **Copy:** sentence case, active voice, name things by what students control ("Just show up"). Empty states give directions.
- **Quality floor (non-negotiable):** keyboard-navigable, visible focus, alt text, WCAG AA contrast, respects reduced-motion, works without the map.

### 3.5 Tech stack

| layer | pick | why |
|---|---|---|
| Framework | Next.js (App Router) + TS + Tailwind | SSR listing pages (SEO), one deploy |
| Map | MapLibre GL (or Leaflet) + free OSM/Carto tiles | no credit card; lat/lng from visits = zero geocoding API |
| Database | Airtable free tier | spreadsheet-UI editing; site pulls w/ revalidation; serves last good build if Airtable down |
| Hosting | Vercel free tier | zero-config Next.js |
| Analytics | Cloudflare Web Analytics or GoatCounter | cookieless, no personal data (users are minors) |
| Domain & email | ~$12/yr domain + project email | never personal email on public site |

**Cost ceiling: ~$12–25/year.** Any real bill → choose differently.

### 3.6 Edge cases (summary)

**Data/content:** location lives on Opportunity not Org (D-1); `varies/remote` location_type (D-2); one-time events require `event_date` + auto-hide (D-3); seasonal stays visible badged "Returns in June" (D-4); structured schedule + `schedule_notes` for irregular (D-5); `min_age`+`guardian_required_under`+`adults_only`, default view filters to under-18-eligible (D-6); human wins over website, note in internal_notes (D-7); `accepting: paused` stays listed w/ banner (D-8); archive within 48h, **never hard-delete** (D-9); one canonical local listing (D-10); non-hour-signing orgs still listable (D-11); publish the fact + disclaimer that chapter rules differ (D-12); `cost_notes` plainly (D-13); honest `onboarding_time` (D-14); no-web-presence listable, verify via IRS search (D-15); `languages` is a feature (D-16).

**People/policy:** no reviews hosted (P-11); you run a map not a placement agency (P-12); moat = relationships + verification habit (P-13); institutionalize for succession (P-14); independent, say so on every page (P-15).

**Technical:** marker clustering (T-1); list view works without map/JS/screen reader (T-2); static gen, ~100KB images, lazy map, <3s on mid phone (T-3); SSR + real titles + sitemap.xml (T-4); moderation queue + honeypot + rate limit (T-5); render all content as plain text never raw HTML (T-6); quarterly link checker (T-7); skip "open now" in v1 (T-8); dark mode supported or explicitly locked, test map contrast (T-9); code in GitHub + monthly Airtable CSV export to repo (T-10); cookieless analytics, no IP retention, no ad pixels (T-11).

**Safety/privacy/legal-ish:** disclaimer block footer+About, parent-reviewed (S-1); org contact info internal, link to org's own signup (S-2); no student data by design — no accounts → no COPPA/FERPA headaches (S-3); photos only with permission, no identifiable minors (S-4); logos only with permission, never city/FUSD seals (S-5); daylight/public visits, parent knows route (S-6).

### 3.7 Freshness system

| verified_at age | badge |
|---|---|
| ≤ 3 months | **✓ Verified [Month Year]** (marigold stamp) |
| 3–6 months | "Last verified [Month Year]" (neutral gray) |
| > 6 months | "Unconfirmed — contact the org before visiting" + drops to bottom of default sort |
| > 9 months, unreachable | status → paused, hidden from default view |

Quarterly loop (4×/year, ~2h): send 60-sec check-in (template 4.1) → "looks good" bumps verified_at, corrections fixed in 48h → no reply in 2 weeks → nudge → website → call → badge decays. Run link checker same pass. Log in build journal.

### 3.8 Metrics (log monthly)

Orgs live / % verified-within-90-days (keep >80%); opportunities by category + school-walkability; weekly visitors + top filters; **outbound "How to start" clicks per listing** (proxy for volunteering facilitated); referrers; org-side anecdotes.

### 3.9 Build plan & working agreement

**Working agreement:** one spec section at a time; "propose a plan first, don't write code yet," edit plan before approving; read every diff; "explain like I'll be quizzed"; 5-line build-journal entry per feature; student writes the data model first; rebuild test each sprint; commit messages in own words in public GitHub repo.

**Sprints (~1 week each):**
- **Sprint 0 — Foundations:** repo, Next.js+Tailwind, domain, email, Airtable base matching 3.2, seed 3 friendly orgs. *Exit: real data as an ugly list on a live URL.*
- **Sprint 1 — Core:** list view, opportunity pages, org pages, SSR, four-questions card. *Exit: usable with zero map/filters.*
- **Sprint 2 — Map & filters:** MapLibre, clustering, synced map/list, full filters, search, freshness badges. *Exit: the two-minute mission is true.*
- **Sprint 3 — Loops:** For-Orgs + self-submit → moderation queue, report-outdated, About w/ policy+disclaimer, quarterly email tooling. *Exit: stays accurate without touching code.*
- **Sprint 4 — Ship:** a11y pass, perf (<3s), SEO, analytics, dark-mode decision, cross-device test, launch checklist.

**Launch checklist:** 25+ orgs · four questions answered each · parent-reviewed disclaimer · report-outdated tested · works on old iPhone/cheap Android/Chromebook · analytics live · About tells the story · soft-launch email to orgs · then counselor pitch (template 4.2) in first week of school (August).

### 3.10 v2 parking lot (build none this summer)

Hour-log generator (pre-filled PDF the org signs) · org self-service edit links · email digest · multilingual UI (Spanish/Mandarin/Hindi/Dari) · school-specific embeddable views · ambassador tools · Congressional App Challenge demo video (~early November).

---

## Part 5: Decisions that are the student's to make

1. **The name** (ServeFremont · TriCityServe · FremontGives · HourMap · other) — check the domain first.
2. **Inclusion policy wording** (P-6/P-7) — published verbatim on About.
3. **Category list** — the 10 are a start; visits refine the taxonomy.
4. **Palette & type** within 3.4 — pick actual hexes/faces.
5. **Airtable vs. JSON-in-repo** — either is right; the reasoning is the point.
6. **What to cut if short on time:** search → org photos → dark mode → group-friendly filter. **Never cut:** verification badges, the four questions, the report-outdated link.

**Order of operations:** three friendly orgs → sprint 0–1 while visiting → 25 visits → sprints 2–4 → soft launch to orgs → school launch in August → Congressional App Challenge in fall → quarterly loops forever.

---

## Templates (Part 4)

**4.1 Quarterly check-in:** "60-second check: is your ServeFremont listing still accurate?" — paste current listing; reply "looks good" or send fix (live in 48h); ask if new volunteers mentioned finding them.

**4.2 Counselor email (August, week one):** "A verified map of Fremont volunteer opportunities for [School] students" — visited [N] orgs in person, filterable by age/schedule/transit/signs-forms, verified quarterly, no student data, free/no ads. Ask to link on counseling/CSF page or for a 5-min demo.

**4.3 Removal/archive confirmation:** confirm unlisted as of today, one email to return.

> Field material — the verbal pitch (1.1), leave-behind one-pager (1.2), objection handling (1.3), follow-up email (1.4), cold email (1.5), and the visit kit / intake form (Part 2) — lives in the printed packet. The intake form *is* the database schema (3.2); keep them in sync.
