# Airtable fill-in plan (2026-07-07)

> **UPDATE 2026-07-07 (evening): Tier 1 is DONE.** All 22 opportunities (13 active + 9 paused/prep, across both address lists below) now have transit info. 18 got `Transit_Notes` filled directly (verified BART distance + real AC Transit line numbers via search, not guessed). The 4 genuinely-remote ones (Don Edwards x2, Coyote Hills, Ohlone WRC) got the "this is far, plan on a ride" reality folded into their **Description** instead, deliberately leaving `Transit_Notes` blank — see the code note below for why.
>
> **UPDATE 2026-07-07 (later): Tier 2 is DONE, with adjustments.**
> - `Shift_Length_Hours` filled on 6 records where a source sentence gave a clean, honest number (see list below). Left blank everywhere the source said "varies," gave two genuinely different options (e.g. "2- or 4-hour shifts" — a real choice, not a range), or gave no duration at all — the field can't represent that without misleading, so free-text `Schedule_Notes` stays the source of truth there.
> - `Season` — skipped entirely. Confirmed via grep it's not read by any page in the app (dead field, zero rendering effect either way).
> - `Near_School` — did NOT bulk-fill Airtable data for this (see code bug below first). Did NOT build the "walkable from your school" filter UI — that's a real feature with design decisions (chip placement, interaction), out of scope for a data-fill pass.
> - **Found and fixed a real bug** in `lib/airtable.ts`/`lib/types.ts`: the code was reading a field called `Walkable_From` that doesn't exist in Airtable at all (only `Near_School` does), *and* separately reading the real `Near_School` field with a boolean-only parser (`isYes()`) that silently returns `false` for every multi-select value. Two broken paths for one real field, both dead ends. Consolidated onto the one that's actually correct — `walkableFrom` now reads `Near_School` properly, matching the array-handling pattern already used for `Categories` elsewhere in the same file. Verified with `npm run typecheck` and a full `npm run build` — both clean. This unblocks the feature for whenever someone builds the UI; it changes nothing visible today since nothing renders it yet.
> - Two structural cleanup items (junk `Onboarding` select options, legacy empty `Organizations` column) are confirmed **not possible via the available API tools** — checked directly, `update_field` only edits name/description/formula, there's no delete-field tool. Still manual-only.
>
> **Tier 3 is still deliberately untouched.** Not an oversight — `Min_Age`, `Signs_Hour_Forms`, `Accepting`, `Guardian_Required_Number`, `Adults_Only` are exactly the fields the site's "verified with a real person" promise exists to protect. A wrong guess here means a real student shows up somewhere they're not old enough for, or expects an hour form that doesn't exist. These wait for the outreach calls/emails in [outreach-drafts-2026-07-07.md](outreach-drafts-2026-07-07.md).

Goal: fill every field we can from **objective / published sources**, without guessing the fields that the site's verification promise depends on. Based on a full survey of both tables (19 orgs, 58 opportunities) taken today.

**Code discovery made during implementation:** `app/api/listings/route.ts` sets the "🚌 Near transit" badge from `!!Transit_Notes` — any non-empty text triggers it, regardless of what it says. So an honest "this is 7 miles from BART, no bus stop at the door" note would still show as "Near transit" to a student scanning the list. That's why the 4 remote ones went into Description instead of Transit_Notes.

## What's already complete (no work needed)

- **Organizations** — all 19 have Name, Address, Lat, Lng, Website, Org_Type, Categories. Contact fields filled everywhere a public contact exists. Nothing to add here.
- **Opportunities** — all 58 have Title, Description, How_To_Start_Steps, How_To_Start_UTL, Onboarding, Schedule_Type. These are in good shape.

So "fill out the Airtable" is really about a handful of **empty logistics fields on the opportunities**, not a blank database.

---

## Tier 1 — Transit notes (highest value, safe, do first)

`Transit_Notes` drives two things: the "Can I get there?" answer and the **"Near transit" tag** on the live site (`nearTransit = has Transit_Notes`). It's an objective geographic fact (nearest BART + AC Transit lines + walk distance from the org address), so it's safe to fill without contacting anyone — and the existing live listings already use exactly this style.

**~15 ACTIVE opportunities are missing it**, grouped by address (look transit up once per address, apply to all its roles):

| Address | Opportunities | Records |
|---|---|---|
| Niles Essanay, 37417 Niles Blvd | Weekend Museum, Movie Night | rec4iv8AY3hByUtWH, recF39OJSR2btss29 |
| MSN, 4074 Eggers Dr | Scout Programs, HS Docent, Summer Camp, Museum Docent | rec5oomppGma26FwQ, recDu7Dkg84TkfCOD, recae83HmdyS0K3zv, recdx9LMKgOorAXWD |
| Washington Township Museum, 190 Anza St | Tour Docent, Behind-the-Scenes, Museum Greeter | recHr5ExAmnN14Hro, recaCkmF6bmziouMS, recvyTQran2UOmbgB |
| Salaam — Islamic Center of Fremont (4th Sat) & 4080 Bay St (3rd Sat) | two distribution sites | recBPhqaabEMu3Vs9, recQVqvP4igR6G476 |
| Tri-City Animal Shelter, 1950 Stevenson Blvd | Shelter Volunteer (18+) | rec8uep4HTOla4ybW |
| Ardenwood, 34600 Ardenwood Blvd | Farmyard Docent | recaNuRZehrz2lhCu |
| Fremont Main Library, 2400 Stevenson Blvd | Seed Library (other library roles already have it) | recuBLdLbTeebPMRr |
| Kids Against Hunger, 40087 Mission Blvd | Meal Packing — **events are at partner sites, not the HQ**; note "location varies" rather than pin transit | recOapwnkWhKRWdtF |

**Skip (genuinely no fixed location):** Virtual Book Reviewer (`recaA9L2w2h8MllOD`) and Community Service From Home (`recTkEIMSW9aQrdGV`) — remote; adding transit would wrongly tag them "near transit."

**Then the 7 PAUSED new orgs** (prep for when they go live): Washington Hospital (2000 Mowry — near transit), Tri-City Breakfast (Irvington Pres), Abode (40849 Fremont Blvd), Age Well (40086 Paseo Padre), Ohlone (Newark WRC), Don Edwards (2 Marshlands — **far from any transit, say so honestly**), Coyote Hills (8000 Patterson Ranch — **also remote, say so**).

Method: verify each address's nearest BART (Fremont / Warm Springs / South Hayward) and the AC Transit lines on its main road before writing — don't assert a bus-line number I haven't checked. Where a site truly isn't transit-accessible, the honest note ("~2 mi from BART, limited bus service; driving/biking recommended") is more useful than a vague one.

## Tier 2 — Shift length + season (medium value, only where stated)

- **`Shift_Length_Hours`** — fill only where the org's own page states a shift length (e.g. Nature Store "2 or 4 hrs", breakfast "~2 hrs"). Leave blank where it's not published rather than inventing a number. Shows in the detail view's "Shift" cell.
- **`Season`** (year_round / summer / school_year / custom) — empty on essentially every record. Mostly inferable (Summer Camp = summer; ongoing roles = year_round). Low value: **confirm the live site even renders this before spending time** — it may not be wired up yet.
- **`Near_School`** (5 FUSD high-school chips) — computable from each address, but same caveat: check it's rendered before filling. Founders packet lists it as a planned filter, so it's future-useful either way.

## Tier 3 — DO NOT web-fill (needs the org, belongs to the outreach pass)

These are the four-questions / verification-promise fields. Guessing them from a website is exactly what the "verified with a real person" moat exists to prevent:

- `Min_Age`, `Signs_Hour_Forms`, `Accepting`, `Guardian_Required_Number`, `Adults_Only`

Leave them for the outreach drafts in [outreach-drafts-2026-07-07.md](outreach-drafts-2026-07-07.md). Where a site states an age outright (Abode 12+, Washington Hospital 16) it's already entered; everything else waits for a human.

## Also (cleanup, from the fact-check pass)

- Junk `Onboarding` select options `"text"` and `"a"` — unused; delete in the Airtable field config (MCP can't edit select choices).
- Legacy empty `Organizations` single-line-text column on Opportunities — candidate for manual deletion.

---

## Recommended order of execution

1. **Tier 1 transit on the ~15 active records** — immediately improves the live site, all safe. (~8 address lookups.)
2. Tier 1 transit on the 7 paused orgs — prep.
3. Tier 2 shift-length where published.
4. Confirm whether Season / Near_School render; fill if so.
5. Leave Tier 3 to outreach.
