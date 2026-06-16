import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/airtable";
import type { Opportunity } from "@/lib/types";
import FreshnessBadge from "@/components/FreshnessBadge";

type Params = { params: Promise<{ id: string }> };

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

// One answer block for the four-questions section.
function Answer({
  icon,
  question,
  children,
}: {
  icon: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <p className="text-sm font-medium text-ink">
        <span className="mr-1.5">{icon}</span>
        {question}
      </p>
      <div className="mt-1 text-sm text-ink-soft">{children}</div>
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
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Link href="/" className="text-sm text-brand">
        ← All opportunities
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">
            {opp.title}
          </h1>
          {opp.orgName &&
            (opp.orgId ? (
              <Link
                href={`/orgs/${opp.orgId}`}
                className="mt-0.5 inline-block text-brand underline"
              >
                {opp.orgName}
              </Link>
            ) : (
              <p className="mt-0.5 text-ink-soft">{opp.orgName}</p>
            ))}
        </div>
        <div className="shrink-0">
          <FreshnessBadge verifiedAt={opp.verifiedAt} size="md" />
        </div>
      </div>

      {opp.description && (
        <p className="mt-4 text-sm leading-relaxed text-ink">{opp.description}</p>
      )}

      {/* The four questions, above the fold (§3.3). */}
      <div className="mt-5 grid grid-cols-1 gap-3">
        <Answer icon="🎂" question="Am I old enough?">
          {ageAnswer(opp)}
        </Answer>
        <Answer icon="🚌" question="Can I get there?">
          {getThereAnswer(opp)}
        </Answer>
        <Answer icon="📝" question="Can I just start?">
          {startAnswer(opp)}
        </Answer>
        <Answer icon="✍️" question="Will they sign my hour form?">
          {opp.signsHourForms
            ? "Yes — they sign school service-hour forms."
            : "Not for school hour forms. Confirm with your CSF/NHS adviser, whose rules may differ."}
        </Answer>
      </div>

      {opp.costNotes && (
        <p className="mt-3 text-sm text-amber-800">Cost: {opp.costNotes}</p>
      )}

      <div className="mt-6">
        {opp.howToStartUrl ? (
          <a
            href={opp.howToStartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-brand px-4 py-3 text-center font-medium text-white transition hover:bg-brand-dark"
          >
            How to start →
          </a>
        ) : (
          <p className="rounded-lg border border-dashed border-ink/20 bg-white px-4 py-3 text-center text-sm text-ink-soft">
            Contact the organization directly to get started.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-ink/10 pt-4 text-xs text-ink-soft">
        {/* TODO: replace with a real project email / report form (Sprint 3). */}
        <a
          href={`mailto:hello@servefremont.example?subject=${reportSubject}`}
          className="underline"
        >
          Report outdated info
        </a>
      </div>
    </main>
  );
}
