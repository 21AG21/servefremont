# Fact-check queue — web-researched orgs (2026-07-07)

> **UPDATE 2026-07-07 (evening): the Fable 5 web fact-check pass has RUN.** Every item below was re-checked against live sources; Airtable records were corrected in place. What remains is only what the web cannot answer — each org needs one direct contact (email/call) before flipping anything to `Active`. Findings are inline: ✅ web-confirmed · ✏️ corrected · ❌ unknowable online, ask the org.

All 7 orgs + 8 opportunities remain **`Status = Paused`**, `Verification_Method = Unverified`. The API (`app/api/listings/route.ts`) only publishes opportunities whose status is blank or `Active`, so nothing renders publicly. Verified post-pass: live feed unchanged.

Base `appLVhrmvogCNfv1O` · Organizations `tblwy0CZCorWajhEx` · Opportunities `tbl7PmL4mQqftALGk`

---

## Cross-cutting results

- **Minimum age** — ✅ Washington Hospital 16 (sophomore standing); ✅ Abode 12+ (re-confirmed on their page); ✏️ Ohlone has *no universal minimum* — role-specific (13+ social media, 15+ pet therapy, parent supervision for most). ❌ Still unknown: Don Edwards, Breakfast Program, Coyote Hills docent, Age Well teen application.
- **Signs hour forms** — ✏️ Ohlone set to **Yes** (their site: service forms emailed to youth@ "for processing and confirmation of service"). ❌ All 6 others: nothing online; must ask.
- **Accepting** — ✏️ **Washington Hospital corrected Yes → Waitlist** (their page: waiting list closed May 22, 2026; next intake Fall 2026). Others still read as recruiting.
- **Lat/Lng** — ✏️ Ohlone now has a pin (WRC, 37175 Hickory St, Newark — approximate); ✏️ Breakfast pin moved to the Irvington Ave/Chapel Way corner; ✅ Don Edwards address confirmed (Visitor Center 2 Marshlands Rd; HQ 1 Marshlands Rd); ✅ Abode 40849 Fremont Blvd confirmed on their page. All still approximate until a front-door visit.

## Source-health warnings found during the pass

- **Tri-City Free Breakfast's website is dead** — the Google Site now redirects to a login. fremont.gov's resource directory is the working reference. Don't link students to the dead site.
- **SF Bay Wildlife Society (Don Edwards volunteer partner) is unreachable online** — sfbayws.org 403s; alternate sfbws.com has a broken TLS cert. Nature Store schedule details rest on one search snippet.
- **fremont.gov and ebparks.org block automated fetching** — their facts came via search results; fine for staging, but confirm by phone/email.

---

## Remaining asks (one contact each — nothing else is missing)

1. **Washington Hospital** — volunteer_services@washingtonhealth.com / (510) 797-1111: do they sign school hour forms? Application pickup at 2000 vs 2500 Mowry? Named coordinator? (Fall 2026 intake — listing stays Waitlist until then.)
2. **Don Edwards NWR** — via fws.gov/refuge/don-edwards-san-francisco-bay/get-involved (or Visitor Center): min age per role, hour forms, is signup via USFWS or the Wildlife Society, is the weekend Nature Store schedule current, named contact.
3. **Ohlone Humane Society** — youth@ohlonehumanesociety.org: which roles suit a solo high schooler (vs. parent-paired), named youth coordinator, confirm hour-form flow.
4. **Tri-City Free Breakfast** — Sherry Hsu (510) 301-0101 or church line (510) 657-3133: teen policy/min age, hour forms, her email, confirm Mon/Wed/Fri schedule still runs.
5. **Coyote Hills** — docents.coyotehills@ebparks.org / (510) 544-3213: docent minimum age (youth permission form exists district-wide, so teens aren't ruled out), hour forms, next training cohort.
6. **Abode Services** — (510) 657-7409: which roles a 12–17-year-old can actually do, hour forms, named coordinator + email.
7. **Age Well Center** — Nick Jordan (510) 790-6602: teen application minimum age, teen-eligible roles, hour forms, his email. (Best teen fit of the batch; FUSD Washington High already points students here.)

## Publish procedure (per org, unchanged)

1. Get the answers above from a real person; fix fields.
2. Set org `Verification_Method` (Email/Call/In-Person) + `Verified_At`.
3. Flip org **and** opportunity `Status` → `Active`.
4. Not teen-eligible → org `Status = Declined` + note.

---

## Cleanup performed in the same pass (2026-07-07)

- **Fremont Main Library duplicate pairs resolved by merge** — TAG (`recEzCfJ2wmti27R4`) and Virtual Book Reviewer (`recaA9L2w2h8MllOD`) kept Active (stable IDs/URLs) and absorbed the fresher `Verified_At = 2026-06-22` + richer schedule notes from their archived 6/22 twins (`recfZgFXETFY87LUW`, `recsznpxMmH4HOiNM`). Seed Library pair was already consistent. Archived twins retained per never-delete rule.
- **Junk select options** `"text"` and `"a"` on Opportunities → Onboarding: used by zero records; the MCP can't edit select choices (formula-only) — delete manually in the Airtable field config sometime.
- **Legacy `Organizations` single-line-text column** on Opportunities: empty on every record; harmless; candidate for manual deletion.
