import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — ServeFremont",
  description:
    "How ServeFremont verifies every volunteer listing in person, our inclusion policy, and the trust promise behind the map.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="font-display text-2xl font-medium text-ink">
        About ServeFremont
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-ink">
        ServeFremont is a free, student-built map of volunteer opportunities in
        Fremont, California. The goal is simple: any student should be able to
        find a legitimate, age-eligible, currently-active opportunity they can
        actually get to — in under two minutes.
      </p>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        The verification promise
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        Every listing is verified in person. We visit each organization, confirm
        the details with a real person, and re-confirm each quarter. Every card
        shows when it was last verified, so you can trust what you read. If a
        listing hasn&apos;t been confirmed in a while, we say so plainly.
      </p>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        Inclusion policy
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        We list nonprofits, government agencies, schools, hospitals, and
        established community institutions. A faith-based or civic organization
        is listable when the volunteer role is genuine community service open to
        any student regardless of belief, with any participation requirements
        clearly labeled. Roles that are primarily recruitment, proselytizing, or
        campaign work are out of scope for a school-hours site.
      </p>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        Your privacy
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        There are no accounts and no logins. We don&apos;t collect student data,
        and any analytics we use are cookieless with no personal information.
      </p>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        Please confirm before you go
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Information is provided by organizations and verified on the date shown,
        but it can change — always confirm with the organization before
        visiting. A listing is not an endorsement. ServeFremont is an independent
        community project and is not affiliated with the Fremont Unified School
        District or the City of Fremont. Volunteers under 18 should involve a
        parent or guardian and follow each organization&apos;s requirements.
        Whether a role counts toward your service hours can vary by school —
        confirm with your CSF or NHS adviser.
      </p>
    </main>
  );
}
