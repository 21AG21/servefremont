import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { categoryClasses } from "@/lib/categoryColors";
import FreshnessBadge from "@/components/FreshnessBadge";

function AcceptingStatus({ accepting }: { accepting: Opportunity["accepting"] }) {
  if (accepting === "yes") {
    return <span className="text-brand">● Accepting now</span>;
  }
  if (accepting === "waitlist") {
    return <span className="text-ink-soft">○ Waitlist</span>;
  }
  if (accepting === "no") {
    return <span className="text-ink-soft">○ Not accepting</span>;
  }
  return <span className="text-ink-soft">○ Ask the organization</span>;
}

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="block rounded-xl border border-ink/10 bg-white p-4 transition hover:border-brand/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{opp.title}</p>
          {opp.orgName && (
            <p className="mt-0.5 text-sm text-ink-soft">{opp.orgName}</p>
          )}
        </div>
        <div className="shrink-0">
          <FreshnessBadge verifiedAt={opp.verifiedAt} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {opp.signsHourForms && (
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand-dark">
            ✓ Signs hour forms
          </span>
        )}
        {opp.minAge != null && (
          <span className="rounded-full bg-marigold-soft px-2.5 py-1 text-marigold-ink">
            Ages {opp.minAge}+
          </span>
        )}
        {opp.categories.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2.5 py-1 ${categoryClasses(cat)}`}
          >
            {cat}
          </span>
        ))}
        {opp.transitNotes && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">
            Near transit
          </span>
        )}
        {opp.groupFriendly && (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-900">
            Groups OK
          </span>
        )}
        {opp.scheduleType?.toLowerCase().includes("drop") && (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-900">
            Drop-in OK
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <AcceptingStatus accepting={opp.accepting} />
        <span className="text-brand">Details →</span>
      </div>
    </Link>
  );
}
