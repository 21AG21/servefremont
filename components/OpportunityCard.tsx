import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import FreshnessBadge from "@/components/FreshnessBadge";

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

const tagBase: React.CSSProperties = {
  borderRadius: 5,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: UI,
  whiteSpace: "nowrap",
  border: "1px solid var(--sf-border)",
  background: "transparent",
  color: "var(--sf-text-soft)",
};

const tagAccent: React.CSSProperties = {
  ...tagBase,
  border: "1px solid var(--sf-accent-border)",
  background: "var(--sf-accent-soft)",
  color: "var(--sf-accent-ink)",
};

function AcceptingStatus({ accepting }: { accepting: Opportunity["accepting"] }) {
  if (accepting === "yes") {
    return <span style={{ color: "var(--sf-accent-ink)" }}>● Accepting now</span>;
  }
  if (accepting === "waitlist") {
    return <span style={{ color: "var(--sf-text-soft)" }}>○ Waitlist</span>;
  }
  if (accepting === "no") {
    return <span style={{ color: "var(--sf-text-soft)" }}>○ Not accepting</span>;
  }
  return <span style={{ color: "var(--sf-text-soft)" }}>○ Ask the organization</span>;
}

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="sf-card"
      style={{
        display: "block",
        borderRadius: 10,
        border: "1.5px solid var(--sf-outline)",
        background: "var(--sf-surface)",
        boxShadow: "0 1px 3px var(--sf-shadow)",
        padding: 14,
        fontFamily: UI,
        color: "var(--sf-text)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--sf-text)" }}>
            {opp.title}
          </p>
          {opp.orgName && (
            <p style={{ margin: 0, marginTop: 2, fontSize: 12.5, color: "var(--sf-text-soft)" }}>
              {opp.orgName}
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <FreshnessBadge verifiedAt={opp.verifiedAt} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {opp.signsHourForms && <span style={tagAccent}>Signs hour forms</span>}
        {opp.minAge != null && <span style={tagBase}>Ages {opp.minAge}+</span>}
        {opp.categories.map((cat) => (
          <span key={cat} style={tagBase}>
            {cat}
          </span>
        ))}
        {opp.transitNotes && <span style={tagBase}>Near transit</span>}
        {opp.groupFriendly && <span style={tagBase}>Groups OK</span>}
        {opp.scheduleType?.toLowerCase().includes("drop") && (
          <span style={tagBase}>Drop-in OK</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
        <AcceptingStatus accepting={opp.accepting} />
        <span style={{ color: "var(--sf-accent)", fontWeight: 600 }}>Details →</span>
      </div>
    </Link>
  );
}
