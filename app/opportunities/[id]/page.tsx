import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/airtable";
import type { Opportunity } from "@/lib/types";
import FreshnessBadge from "@/components/FreshnessBadge";

type Params = { params: Promise<{ id: string }> };

// Lets Vercel's edge cache absorb repeat hits on the same listing instead of
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

// Server-rendered title so "[role], [age]+ — [org], Fremont" is indexable (§3.4 T-4).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) return { title: "Opportunity not found — ServeFremont" };

  const age = opp.minAge != null ? `, ${opp.minAge}+` : "";
  const org = opp.orgName ? ` — ${opp.orgName}` : "";
  return {
    title: `Volunteer ${opp.title}${age}${org}, Fremont`,
    description: opp.description ?? `Volunteer as ${opp.title} in Fremont, CA.`,
  };
}

// One question/answer block — plain text carries the weight, no icon.
function Answer({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--sf-bg)",
        border: "1px solid var(--sf-border)",
        borderRadius: 10,
        padding: "11px 13px",
        marginTop: 9,
      }}
    >
      <p style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 600, color: "var(--sf-text)", margin: 0 }}>
        {question}
      </p>
      <div style={{ fontFamily: UI, fontSize: 12, color: "var(--sf-text-soft)", marginTop: 4, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

function ageAnswer(opp: Opportunity): string {
  if (opp.adultsOnly) return "Adults only (18+).";
  const parts: string[] = [];
  parts.push(opp.minAge != null ? `Open to ages ${opp.minAge} and up.` : "No minimum age listed.");
  if (opp.guardianRequiredUnder != null) {
    parts.push(`A parent or guardian is required under ${opp.guardianRequiredUnder}.`);
  }
  return parts.join(" ");
}

function getThereAnswer(opp: Opportunity): string {
  const parts: string[] = [];
  if (opp.city) parts.push(`Located in ${opp.city}.`);
  if (opp.transitNotes) parts.push(opp.transitNotes);
  if (opp.walkableFrom.length)
    parts.push(`Walkable from ${opp.walkableFrom.join(", ")}.`);
  return parts.length ? parts.join(" ") : "Location details not listed yet.";
}

function startAnswer(opp: Opportunity): string {
  const parts: string[] = [];
  if (opp.onboarding) parts.push(opp.onboarding);
  if (opp.onboardingTime) parts.push(`Typically ${opp.onboardingTime}.`);
  if (opp.scheduleType) parts.push(`Schedule: ${opp.scheduleType}.`);
  if (opp.scheduleNotes) parts.push(opp.scheduleNotes);
  return parts.length ? parts.join(" ") : "Ask the organization how to start.";
}

export default async function OpportunityPage({ params }: Params) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const reportSubject = encodeURIComponent(
    `Outdated listing: ${opp.title}${opp.orgName ? ` (${opp.orgName})` : ""}`
  );

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
          color: "var(--sf-text)",
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          className="sf-link"
          style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-accent)" }}
        >
          ← All opportunities
        </Link>

        <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, margin: 0, color: "var(--sf-text)" }}>
              {opp.title}
            </h1>
            {opp.orgName &&
              (opp.orgId ? (
                <Link
                  href={`/orgs/${opp.orgId}`}
                  className="sf-link"
                  style={{ display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--sf-accent)" }}
                >
                  {opp.orgName}
                </Link>
              ) : (
                <p style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: "var(--sf-text-soft)" }}>
                  {opp.orgName}
                </p>
              ))}
          </div>
          <div style={{ flexShrink: 0 }}>
            <FreshnessBadge verifiedAt={opp.verifiedAt} size="md" />
          </div>
        </div>

        {opp.description && (
          <p style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--sf-text-soft)" }}>
            {opp.description}
          </p>
        )}

        {/* The four questions, above the fold (§3.3). */}
        <div style={{ marginTop: 6 }}>
          <Answer question="Am I old enough?">{ageAnswer(opp)}</Answer>
          <Answer question="Can I get there?">{getThereAnswer(opp)}</Answer>
          <Answer question="Can I just start?">{startAnswer(opp)}</Answer>
          <Answer question="Will they sign my hour form?">
            {opp.signsHourForms === true
              ? "Yes — they sign school service-hour forms."
              : opp.signsHourForms === false
                ? "No — they don't sign school hour forms. Confirm with your CSF/NHS adviser, whose rules may differ."
                : "Not confirmed yet — ask them directly when you reach out, and check with your CSF/NHS adviser."}
          </Answer>
        </div>

        {opp.costNotes && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--sf-gold-ink)" }}>
            Cost: {opp.costNotes}
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          {opp.howToStartUrl ? (
            <a
              href={opp.howToStartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-btn"
              style={{
                display: "block",
                textAlign: "center",
                borderRadius: 10,
                padding: 12,
                background: "var(--sf-accent)",
                color: "var(--sf-on-accent)",
                fontWeight: 600,
                fontSize: 13.5,
                textDecoration: "none",
              }}
            >
              How to start →
            </a>
          ) : (
            <p
              style={{
                margin: 0,
                borderRadius: 10,
                border: "1px dashed var(--sf-input-border)",
                padding: 12,
                textAlign: "center",
                fontSize: 13,
                color: "var(--sf-text-muted)",
              }}
            >
              Contact the organization directly to get started.
            </p>
          )}
        </div>

        <div style={{ marginTop: 20, borderTop: "1px solid var(--sf-border)", paddingTop: 14, fontSize: 12, color: "var(--sf-text-muted)" }}>
          {/* TODO: replace with a real project email / report form (Sprint 3). */}
          <a
            href={`mailto:hello@servefremont.example?subject=${reportSubject}`}
            className="sf-link"
            style={{ color: "var(--sf-text-muted)", textDecoration: "underline" }}
          >
            Report outdated info
          </a>
        </div>
      </div>
    </main>
  );
}
