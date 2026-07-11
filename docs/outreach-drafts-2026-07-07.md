# Outreach drafts — 7 staged orgs

*Created 2026-07-07. Revised 2026-07-10: all seven are now emails (was a mix of emails + phone scripts), and the redundant "do you sign hour forms?" question was cut anywhere the org already answers it (e.g. Ohlone's own site says they sign — asking would just look like you didn't read it).*

Copy-paste emails for the orgs added in the web-research pass. Six have a real, published inbox. The seventh (Tri-City Free Breakfast) has no program email — it runs out of a church, so that one's addressed to the church office and you copy their address off their contact page (noted inline).

Nothing has been sent yet. Update each org's `Internal_Notes` + `Verification_Method`/`Verified_At` once they reply, same as Afghan Coalition and Tri-City Volunteers.

**Suggested order** (best fit / lowest friction first): Age Well → Ohlone → Coyote Hills → Abode → Tri-City Breakfast → Don Edwards → Washington Hospital (their intake isn't open until fall, so it can wait).

Each email asks at most two things — only what actually decides whether the listing belongs on the site and can't be answered from their own page.

---

## 1. Age Well Center at Lake Elizabeth

**To:** NJordan@fremont.gov  *(Nick Jordan, Volunteer/Program Coordinator — his real city address, from the Age Well staff directory)*
**Subject:** Teen volunteering — quick question from a Fremont student

> Hi Nick,
>
> I'm a Fremont high schooler putting together a directory of volunteer spots for students, called ServeFremont. I saw the Age Well Center takes teen volunteers through the city's Teen Volunteer Application — before I point students your way, could I check two things: what's the minimum age, and which roles do teens usually end up in (office, garden, kitchen, that kind of thing)?
>
> Thanks,
> Arjun

*No hours question on purpose — FUSD's own Washington High community-service page already routes students here, so hour-signing is effectively a given.*

---

## 2. Ohlone Humane Society

**To:** youth@ohlonehumanesociety.org
**Subject:** Question about the youth volunteering program

> Hi,
>
> I'm building a directory of Fremont-area volunteer opportunities for high schoolers (it's called ServeFremont), and I want to get one thing right before I list your program. On your youth page, most roles look like they need a parent signed up alongside the student — are there any a student could do on their own, without a parent also volunteering?
>
> Thanks so much,
> Arjun

*Cut the hours question entirely — your site already states you sign service hour forms.*

---

## 3. Coyote Hills Regional Park

**To:** docents.coyotehills@ebparks.org
**Subject:** Teen docent eligibility — quick question

> Hi,
>
> I'm a Fremont high schooler building a directory of local volunteer opportunities (ServeFremont), and the docent program at Coyote Hills — the Ohlone-culture and marsh-ecology side especially — is exactly the kind of thing I'd want to send students toward. Before I list it: is the program open to high schoolers, or is it adults only?
>
> Appreciate it,
> Arjun

*One question — eligibility is the only real gate. If teens are welcome, whether a structured East Bay Regional Parks program signs hours is a trivial follow-up, not worth cluttering the first email.*

---

## 4. Abode Services

**To:** info@abode.org
**Subject:** Teen volunteer roles — quick question

> Hi,
>
> I'm a Fremont high schooler building a directory of volunteer opportunities for students (ServeFremont). Your site says volunteers need to be 12 and up, which is great — I mainly wanted to know which roles someone in the 12–17 range can do on their own versus ones that need an adult along, and whether volunteer hours can be signed off for school service. Should students just start with the form at abode.org/volunteer, or is there a better first step for that age group?
>
> Thanks,
> Arjun

*Hours question kept here — nothing on their site states it either way.*

---

## 5. Tri-City Free Breakfast Program

**To:** *the church office — grab their email off* **irvingtonpres.org/contact-us** *(it's published there; I couldn't copy the plaintext cleanly, and I won't guess an address. The program runs out of Irvington Presbyterian, so this reaches the right people.)*
**Subject:** Student volunteers for the breakfast program?

> Hi,
>
> I'm a Fremont high schooler putting together a list of volunteer spots for students (ServeFremont). I saw the Tri-City Free Breakfast Program runs Monday, Wednesday, and Friday mornings out of the church. Could you tell me whether teen volunteers are welcome and if there's a minimum age? And if this is really Sherry Hsu's program, I'd be grateful to be pointed her way. If the morning shifts count toward school service hours, that's useful to know too.
>
> Thanks,
> Arjun

*Their old program website is dead (redirects to a login page), so email through the church is the only real channel. Sherry Hsu runs the program; phone backup if email goes nowhere: (510) 301-0101.*

---

## 6. Don Edwards SF Bay National Wildlife Refuge

**To:** sfbayws@sfbayws.org  *(San Francisco Bay Wildlife Society — the refuge's volunteer partner; their general volunteer inbox)*
**Subject:** Teen volunteering at the refuge — Nature Store / restoration days

> Hi,
>
> I'm a Fremont high schooler building a directory of volunteer opportunities for students (ServeFremont). I saw the Society runs the volunteer roles at Don Edwards — the Nature Store and the habitat-restoration days especially. Could you tell me whether high schoolers can take those on, what the minimum age is, and whether the hours count toward school community service? If someone else handles those specific roles, I'd be glad to be pointed their way.
>
> Thanks,
> Arjun

*If no reply: Aidona Kakouros (aidona_kakouros@fws.gov) is a real refuge contact, but specifically for Warm Springs tour docents — try the Society's general inbox above first.*

---

## 7. Washington Hospital Healthcare System *(low priority — waitlist closed until fall 2026)*

**To:** volunteer_services@washingtonhealth.com
**Subject:** High school volunteer program — fall applicant

> Hi,
>
> I'm a Fremont high schooler putting together a directory of volunteer options for students (a project called ServeFremont). I saw the high school volunteer program's waitlist is closed until fall — could you let me know when applications reopen, and whether there's a way to be notified? I'd like to pass that along to other students at the right time.
>
> Thanks for your time,
> Arjun

*Min age (16) is already on file, so this is really just about timing — no need to ask anything else yet.*

---

## After each reply

1. Update the org's `Internal_Notes` with what they said + the date.
2. Fill in whatever was actually missing (min age, `Signs_Hour_Forms`, named contact/email).
3. Set `Verification_Method` (Email) + `Verified_At`.
4. Flip the org **and** its opportunity `Status` → `Active`.
5. Not teen-eligible after all → `Status = Declined` with a one-line note why.
