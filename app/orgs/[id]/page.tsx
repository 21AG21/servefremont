import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganization, getOpportunities } from "@/lib/airtable";
import OpportunityCard from "@/components/OpportunityCard";

type Params = { params: Promise<{ id: string }> };

// Lets Vercel's edge cache absorb repeat hits on the same org page instead of
// re-invoking the origin function on every request (see
// docs/abuse-protection-plan.md). Returning [] from generateStaticParams is
// required for a dynamic segment to get ISR-at-runtime instead of being
// fully dynamic — Next renders each id on first visit, then caches it.
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const org = await getOrganization(id);
  if (!org) return { title: "Organization not found — ServeFremont" };
  return {
    title: `${org.name} — volunteer opportunities in Fremont`,
    description:
      org.mission ?? `Volunteer with ${org.name} in Fremont, CA.`,
  };
}

export default async function OrganizationPage({ params }: Params) {
  const { id } = await params;
  const [org, allOpps] = await Promise.all([
    getOrganization(id),
    getOpportunities(),
  ]);
  if (!org) notFound();

  const opps = allOpps.filter((o) => o.orgId === org.id);

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
          fontFamily: UI,
          boxSizing: "border-box",
        }}
      >
        <Link href="/" className="sf-link" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-accent)" }}>
          ← All opportunities
        </Link>

        <h1 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, marginTop: 12, marginBottom: 0, color: "var(--sf-text)" }}>
          {org.name}
        </h1>
        {org.address && (
          <p style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: "var(--sf-text-soft)" }}>
            {org.address}
          </p>
        )}
        {org.mission && (
          <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--sf-text-soft)" }}>
            {org.mission}
          </p>
        )}

        {org.website && (
          <div style={{ marginTop: 12 }}>
            <a
              href={
                org.website.startsWith("http")
                  ? org.website
                  : `https://${org.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="sf-link"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-accent)", textDecoration: "underline" }}
            >
              Visit website →
            </a>
          </div>
        )}

        <h2 style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, marginTop: 20, marginBottom: 0, color: "var(--sf-text)" }}>
          Volunteer opportunities
        </h2>
        {opps.length === 0 ? (
          <p style={{ marginTop: 8, fontSize: 12.5, color: "var(--sf-text-muted)" }}>
            No active opportunities listed right now.
          </p>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {opps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
