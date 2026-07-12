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
      <h2 style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 0, color: "var(--sf-text)" }}>
        {heading}
      </h2>
      <p
        style={{
          fontFamily: UI,
          fontSize: 12.5,
          lineHeight: 1.65,
          marginTop: 6,
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
        display: "flex",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border)",
          borderRadius: 14,
          padding: 24,
          boxShadow:
            "0 1px 2px var(--sf-shadow), 0 20px 44px -22px var(--sf-shadow-strong)",
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          className="sf-link"
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--sf-accent)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 16,
          }}
        >
          ← Back to ServeFremont
        </Link>

        <h1 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, margin: 0, color: "var(--sf-text)" }}>
          About ServeFremont
        </h1>

        <p style={{ fontFamily: UI, fontSize: 12.5, lineHeight: 1.65, marginTop: 12, marginBottom: 0, color: "var(--sf-text-soft)" }}>
          ServeFremont is a free, student-built map of volunteer opportunities in
          Fremont, California. The goal is simple: any student should be able to
          find a legitimate, age-eligible, currently-active opportunity they can
          actually get to — in under two minutes.
        </p>

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
