// Freshness logic from the spec (§3.7). Drives the verification stamp, the
// decay messaging, and the default "most recently verified" sort.

export type FreshnessLevel = "fresh" | "aging" | "stale" | "unverified";

export type Freshness = {
  level: FreshnessLevel;
  monthYear?: string; // e.g. "Jun 2026"
};

function parse(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthsSince(date: Date): number {
  const now = new Date();
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  );
}

export function getFreshness(verifiedAt?: string): Freshness {
  const date = parse(verifiedAt);
  if (!date) return { level: "unverified" };

  const monthYear = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const months = monthsSince(date);

  if (months <= 3) return { level: "fresh", monthYear };
  if (months <= 6) return { level: "aging", monthYear };
  return { level: "stale", monthYear };
}

// Higher = more recently verified. Unverified sinks to the bottom.
export function verifiedSortKey(verifiedAt?: string): number {
  const date = parse(verifiedAt);
  return date ? date.getTime() : -Infinity;
}
