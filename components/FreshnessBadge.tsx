import { getFreshness } from "@/lib/freshness";

// The verification stamp is the product's one design flourish (§3.4). Fresh
// listings get the marigold rubber-stamp; older ones decay to honest text.
export default function FreshnessBadge({
  verifiedAt,
  size = "sm",
}: {
  verifiedAt?: string;
  size?: "sm" | "md";
}) {
  const { level, monthYear } = getFreshness(verifiedAt);
  const text = size === "md" ? "text-sm" : "text-xs";

  if (level === "fresh") {
    return (
      <span
        className={`inline-flex -rotate-2 items-center gap-1 rounded-md border border-marigold/50 bg-marigold-soft px-2 py-1 font-display font-medium text-marigold-ink ${text}`}
      >
        ✓ Verified by a visit · {monthYear}
      </span>
    );
  }

  if (level === "aging") {
    return (
      <span className={`text-ink-soft ${text}`}>Last verified {monthYear}</span>
    );
  }

  if (level === "stale") {
    return (
      <span className={`text-amber-700 ${text}`}>
        Unconfirmed — contact the organization before visiting
      </span>
    );
  }

  return <span className={`text-ink-soft ${text}`}>Not yet verified</span>;
}
