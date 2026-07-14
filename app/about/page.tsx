import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — ServeFremont",
  description:
    "How ServeFremont verifies every volunteer listing with a real person at the organization, our inclusion policy, and the trust promise behind the map.",
};

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

function Section({
  heading,
  children,
  soft = false,
}: {
  heading: string;
  children: React.ReactNode;
  soft?: boolean;
}) {
  return (
    <>
      <h2
        style={{
          fontFamily: UI,
          fontSize: 18,
          fontWeight: 700,
          marginTop: 40,
          marginBottom: 0,
          color: "var(--sf-text)",
        }}
      >
        {heading}
      </h2>
      <p
        style={{
          fontFamily: UI,
          fontSize: 16.5,
          lineHeight: 1.7,
          marginTop: 10,
          marginBottom: 0,
          color: soft ? "var(--sf-text-muted)" : "var(--sf-text-soft)",
        }}
      >
        {children}
      </p>
    </>
  );
}

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--sf-bg)",
        padding: "clamp(28px, 8vw, 88px) 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link
          href="/"
          className="sf-link"
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--sf-text-muted)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← ServeFremont
        </Link>

        <h1
          style={{
            fontFamily: UI,
            fontSize: "clamp(28px, 5vw, 38px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            margin: "22px 0 0",
            color: "var(--sf-text)",
          }}
        >
          About ServeFremont
        </h1>

        <p
          style={{
            fontFamily: UI,
            fontSize: 18,
            lineHeight: 1.7,
            marginTop: 20,
            marginBottom: 0,
            color: "var(--sf-text-soft)",
          }}
        >
          ServeFremont is a free, student-built map of volunteer opportunities in
          Fremont, California. The goal is simple: any student should be able to
          find a legitimate, age-eligible, currently-active opportunity they can
          actually get to — in under two minutes.
        </p>

        <div
          style={{
            marginTop: 32,
            padding: "18px 20px",
            background: "var(--sf-callout-bg)",
            border: "1px solid var(--sf-callout-border)",
            borderRadius: 12,
          }}
        >
          <h2
            style={{
              fontFamily: UI,
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              color: "var(--sf-callout-strong)",
            }}
          >
            Need a service-hour form?
          </h2>
          <p
            style={{
              fontFamily: UI,
              fontSize: 14.5,
              lineHeight: 1.6,
              margin: "8px 0 0",
              color: "var(--sf-callout-text)",
            }}
          >
            Most organizations will sign a form — they just don&apos;t provide
            one, so bring your own printed copy. This is Washington High
            School&apos;s official form; if you go to a different school, use
            your own school&apos;s version instead.
          </p>
          <a
            href="/community-service-hours-form.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="sf-btn"
            style={{
              marginTop: 14,
              display: "inline-block",
              borderRadius: 10,
              padding: "10px 18px",
              background: "var(--sf-accent)",
              color: "var(--sf-on-accent)",
              fontFamily: UI,
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Download your own form now
          </a>
        </div>

        <Section heading="The verification promise">
          Every listing is verified directly with a real person at the
          organization — by visit, phone, or email — and re-confirmed each
          quarter. Every card shows when it was last verified, so you can trust
          what you read. If a listing hasn&apos;t been confirmed in a while, we
          say so plainly.
        </Section>

        <Section heading="Inclusion policy">
          We list nonprofits, government agencies, schools, hospitals, and
          established community institutions. A faith-based or civic organization
          is listable when the volunteer role is genuine community service open to
          any student regardless of belief, with any participation requirements
          clearly labeled. Roles that are primarily recruitment, proselytizing, or
          campaign work are out of scope for a school-hours site.
        </Section>

        <Section heading="Your privacy">
          There are no accounts and no logins. We don&apos;t collect student data,
          and any analytics we use are cookieless with no personal information.
        </Section>

        <Section heading="Please confirm before you go" soft>
          Information is provided by organizations and verified on the date shown,
          but it can change — always confirm with the organization before
          visiting. A listing is not an endorsement. ServeFremont is an independent
          community project and is not affiliated with the Fremont Unified School
          District or the City of Fremont. Volunteers under 18 should involve a
          parent or guardian and follow each organization&apos;s requirements.
          Whether a role counts toward your service hours can vary by school —
          confirm with your CSF or NHS adviser.
        </Section>
      </div>
    </main>
  );
}
