import { getFreshness } from "@/lib/freshness";

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

// Quiet plain-text verification mark — no stamp, no chip. Fresh listings
// get the accent color; older ones decay to progressively quieter text.
export default function FreshnessBadge({
  verifiedAt,
  size = "sm",
}: {
  verifiedAt?: string;
  size?: "sm" | "md";
}) {
  const { level, monthYear } = getFreshness(verifiedAt);
  const base: React.CSSProperties = {
    fontFamily: UI,
    fontSize: size === "md" ? 13 : 11.5,
    fontWeight: 500,
  };

  if (level === "fresh") {
    return (
      <span style={{ ...base, color: "var(--sf-accent-ink)" }}>
        Verified {monthYear}
      </span>
    );
  }

  if (level === "aging") {
    return (
      <span style={{ ...base, color: "var(--sf-text-soft)" }}>
        Last verified {monthYear}
      </span>
    );
  }

  if (level === "stale") {
    return (
      <span style={{ ...base, color: "var(--sf-gold-ink)" }}>
        Unconfirmed — contact the organization before visiting
      </span>
    );
  }

  return (
    <span style={{ ...base, color: "var(--sf-text-muted)" }}>
      Not yet verified
    </span>
  );
}
