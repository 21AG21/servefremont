import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganization, getOpportunities } from "@/lib/airtable";
import OpportunityCard from "@/components/OpportunityCard";

type Params = { params: Promise<{ id: string }> };

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
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <Link href="/" className="text-sm text-brand">
        ← All opportunities
      </Link>

      <h1 className="mt-3 font-display text-2xl font-medium text-ink">
        {org.name}
      </h1>
      {org.address && (
        <p className="mt-0.5 text-sm text-ink-soft">{org.address}</p>
      )}
      {org.mission && (
        <p className="mt-3 text-sm leading-relaxed text-ink">{org.mission}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {org.website && (
          <a
            href={
              org.website.startsWith("http")
                ? org.website
                : `https://${org.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Visit website →
          </a>
        )}
      </div>

      <h2 className="mt-6 font-display text-lg font-medium text-ink">
        Volunteer opportunities
      </h2>
      {opps.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          No active opportunities listed right now.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {opps.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </main>
  );
}
