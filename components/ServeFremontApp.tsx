"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listing";
import { haversineMiles, formatMiles } from "@/lib/distance";
import AddressBox from "@/components/AddressBox";
import { useIsMobile } from "@/lib/useIsMobile";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => <div style={center("var(--sf-text-muted)")}>Loading map…</div>,
});

// Where the "Report a problem" link in the detail view sends the user.
const REPORT_PROBLEM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSekWo3JMmGrF6FujRdIr6UQ73W_7aqhus7r4XqJaDkgEv96uQ/viewform";

const AGES = [13, 14, 15, 16, 17, 18];
const SCHEDULES = ["Shifts", "Drop-in", "Events", "Flexible/Remote"];
const REQUIREMENTS: { key: string; label: string }[] = [
  { key: "signs", label: "Signs hour forms" },
  { key: "transit", label: "Near transit" },
  { key: "groups", label: "Groups OK" },
];
const STATUSES: { key: string; label: string }[] = [
  { key: "accepting", label: "Accepting now" },
  { key: "waitlist", label: "Waitlist" },
];

function center(color: string): React.CSSProperties {
  return {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color,
    fontSize: 13,
  };
}

type Filters = {
  categories: string[];
  schedules: string[];
  requirements: string[];
  statuses: string[];
};

const EMPTY: Filters = {
  categories: [],
  schedules: [],
  requirements: [],
  statuses: [],
};

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function ServeFremontApp() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeAge, setActiveAge] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [showMap, setShowMap] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 640
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Theme: session-only (no storage). The layout's inline script sets the
  // initial dataset attribute from the OS preference before paint; we mirror
  // that here so React's view of theme matches the DOM from the first render.
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }
    return "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Org sections start expanded; user collapses by clicking the header.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleOrg = (name: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setListings(data.listings ?? []);
      })
      .catch(() => !cancelled && setError("Could not load listings."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId || detailId) return;
    document
      .getElementById(`row-${activeId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, detailId]);

  const categories = Array.from(
    new Set(listings.flatMap((l) => l.category))
  ).sort();

  const filtered = listings.filter((l) => {
    if (activeAge != null) {
      if (l.ageMin != null && l.ageMin > activeAge) return false;
      if (l.ageMax != null && l.ageMax < activeAge) return false;
    }
    if (
      filters.categories.length &&
      !filters.categories.some((c) => l.category.includes(c))
    )
      return false;
    if (
      filters.schedules.length &&
      !(l.schedule && filters.schedules.includes(l.schedule))
    )
      return false;
    for (const req of filters.requirements) {
      if (req === "signs" && !l.signsHourForms) return false;
      if (req === "transit" && !l.nearTransit) return false;
      if (req === "groups" && !l.groupsOK) return false;
    }
    if (filters.statuses.length) {
      const ok =
        (filters.statuses.includes("accepting") && l.accepting) ||
        (filters.statuses.includes("waitlist") && !l.accepting);
      if (!ok) return false;
    }
    return true;
  });

  const distances = useMemo(() => {
    const m = new Map<string, number>();
    if (userLoc) {
      for (const l of listings) {
        if (l.lat != null && l.lng != null) {
          m.set(l.id, haversineMiles(userLoc, { lat: l.lat, lng: l.lng }));
        }
      }
    }
    return m;
  }, [userLoc, listings]);

  const sorted = useMemo(() => {
    if (!userLoc) {
      return [...filtered].sort(
        (a, b) =>
          (a.org || "").localeCompare(b.org || "") ||
          a.title.localeCompare(b.title)
      );
    }
    return [...filtered].sort((a, b) => {
      const da = distances.get(a.id);
      const db = distances.get(b.id);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [filtered, userLoc, distances]);

  type OrgGroup = {
    orgName: string;
    listings: Listing[];
    lat?: number;
    lng?: number;
  };

  const orgGroups = useMemo<OrgGroup[]>(() => {
    const seen = new Map<string, OrgGroup>();
    const order: string[] = [];
    for (const l of sorted) {
      const name = (l.org || "Other").replace(" - Placeholder", "");
      if (!seen.has(name)) {
        seen.set(name, {
          orgName: name,
          listings: [],
          lat: l.lat ?? undefined,
          lng: l.lng ?? undefined,
        });
        order.push(name);
      }
      seen.get(name)!.listings.push(l);
    }
    return order.map((n) => seen.get(n)!);
  }, [sorted]);

  const detail = detailId ? listings.find((l) => l.id === detailId) : null;

  const pill = (label: string, on: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${on ? "var(--sf-pu)" : "var(--sf-border)"}`,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 13,
        fontWeight: on ? 700 : 500,
        background: on ? "var(--sf-pu)" : "var(--sf-surface)",
        color: on ? "#ffffff" : "var(--sf-text-soft)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );

  const divider = (
    <span
      style={{
        width: 1,
        height: 22,
        background: "var(--sf-divider)",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );

  const filterPills = (
    <>
      <div
        style={{
          display: "flex",
          background: "var(--sf-pill-track)",
          borderRadius: 9,
          padding: 3,
          gap: 2,
          flexShrink: 0,
        }}
      >
        {AGES.map((a) => {
          const on = activeAge === a;
          return (
            <button
              key={a}
              onClick={() => setActiveAge(on ? null : a)}
              style={{
                border: "none",
                borderRadius: 7,
                padding: "5px 11px",
                fontSize: 13,
                fontWeight: on ? 600 : 400,
                color: on ? "var(--sf-text)" : "var(--sf-text-muted)",
                background: on ? "var(--sf-surface)" : "transparent",
                boxShadow: on ? "0 1px 3px var(--sf-shadow)" : "none",
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          );
        })}
      </div>

      {categories.length > 0 && divider}
      {categories.map((c) => (
        <span key={`cat-${c}`}>
          {pill(c, filters.categories.includes(c), () =>
            setFilters((f) => ({ ...f, categories: toggle(f.categories, c) }))
          )}
        </span>
      ))}

      {divider}
      {SCHEDULES.map((s) => (
        <span key={`sch-${s}`}>
          {pill(s, filters.schedules.includes(s), () =>
            setFilters((f) => ({ ...f, schedules: toggle(f.schedules, s) }))
          )}
        </span>
      ))}

      {divider}
      {REQUIREMENTS.map((r) => (
        <span key={`req-${r.key}`}>
          {pill(r.label, filters.requirements.includes(r.key), () =>
            setFilters((f) => ({
              ...f,
              requirements: toggle(f.requirements, r.key),
            }))
          )}
        </span>
      ))}

      {divider}
      {STATUSES.map((s) => (
        <span key={`st-${s.key}`}>
          {pill(s.label, filters.statuses.includes(s.key), () =>
            setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s.key) }))
          )}
        </span>
      ))}
    </>
  );

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "var(--sf-text)",
        background: "var(--sf-bg)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid var(--sf-border-soft)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo.svg"
            alt=""
            width={24}
            height={24}
            style={{ flexShrink: 0 }}
          />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>
            ServeFremont
          </span>
          {!isMobile && (
            <span style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>
              Volunteer spots in Fremont
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              fontSize: 15,
              lineHeight: 1,
              border: "1px solid var(--sf-input-border)",
              borderRadius: 8,
              padding: "6px 10px",
              background: "var(--sf-surface)",
              color: "var(--sf-text-soft)",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={() => setShowMap((v) => !v)}
            style={{
              fontSize: 13,
              border: "1px solid var(--sf-input-border)",
              borderRadius: 8,
              padding: "6px 14px",
              background: "var(--sf-surface)",
              color: "var(--sf-text-soft)",
              cursor: "pointer",
            }}
          >
            {isMobile ? (showMap ? "List" : "Map") : showMap ? "Hide map" : "Show map"}
          </button>
        </div>
      </div>

      {/* Address bar — its own row, prominent. */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 20px 8px",
          borderBottom: "1px solid var(--sf-border-soft)",
        }}
      >
        <AddressBox
          active={!!userLoc}
          onPick={(loc) => setUserLoc(loc)}
          onClear={() => setUserLoc(null)}
          fullWidth
        />
      </div>

      {/* Filter bar */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 20px 14px",
          borderBottom: "1px solid var(--sf-border-soft)",
        }}
      >
        {isMobile ? (
          <div
            className="filter-scroll"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {filterPills}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {filterPills}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left column: list OR detail — hidden on mobile when map is showing */}
        <div
          style={{
            flex: showMap && !isMobile ? "38" : "1",
            display: isMobile && showMap ? "none" : undefined,
            minWidth: 0,
            overflowY: detail ? "hidden" : "auto",
            background: detail ? "var(--sf-bg)" : "var(--sf-bg-list)",
            padding: detail ? 0 : 14,
          }}
        >
          {detail ? (
            <DetailView
              listing={detail}
              distance={distances.get(detail.id)}
              orgOppCount={
                orgGroups.find((g) =>
                  g.listings.some((l) => l.id === detail.id),
                )?.listings.length ?? 1
              }
              onBack={() => setDetailId(null)}
            />
          ) : loading ? (
            <p style={{ padding: 6, color: "var(--sf-text-muted)", fontSize: 13 }}>
              Loading opportunities…
            </p>
          ) : error ? (
            <p style={{ padding: 6, color: "var(--sf-text-muted)", fontSize: 13 }}>{error}</p>
          ) : sorted.length === 0 ? (
            <p style={{ padding: 6, color: "var(--sf-text-muted)", fontSize: 13 }}>
              No opportunities match these filters.
            </p>
          ) : (
            orgGroups.map((group, gi) => {
              const orgActive = group.listings.some((l) => l.id === activeId);
              const orgDistance =
                group.lat != null && group.lng != null && userLoc
                  ? distances.get(group.listings[0].id)
                  : undefined;
              const isCollapsed = collapsed.has(group.orgName);
              return (
                <div key={group.orgName} style={{ marginBottom: 18 }}>
                  <OrgHeader
                    index={gi + 1}
                    name={group.orgName}
                    count={group.listings.length}
                    distance={orgDistance}
                    active={orgActive}
                    collapsed={isCollapsed}
                    onToggle={() => toggleOrg(group.orgName)}
                  />
                  {!isCollapsed &&
                    group.listings.map((l) => (
                      <ListingRow
                        key={l.id}
                        listing={l}
                        active={l.id === activeId}
                        distance={distances.get(l.id)}
                        onClick={() => {
                          if (activeId === l.id) setDetailId(l.id);
                          else setActiveId(l.id);
                        }}
                      />
                    ))}
                </div>
              );
            })
          )}
        </div>

        {/* Map — full width on mobile, 62% on desktop */}
        {showMap && (
          <div style={{ flex: isMobile ? "1" : "62", minWidth: 0, position: "relative" }}>
            <ListingMap
              orgGroups={orgGroups}
              activeId={activeId}
              onSelect={setActiveId}
              userLoc={userLoc}
              theme={theme}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function VerifiedBadge({ verified }: { verified?: string }) {
  if (!verified) return null;
  return (
    <span
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        color: "var(--sf-gr-d)",
        background: "var(--sf-gr-l)",
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      ✓ Verified {verified}
    </span>
  );
}

function OrgHeader({
  index,
  name,
  count,
  distance,
  active,
  collapsed,
  onToggle,
}: {
  index: number;
  name: string;
  count: number;
  distance?: number;
  active: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px 10px 4px",
        width: "100%",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: active ? "var(--sf-pu)" : "var(--sf-text-muted)",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid var(--sf-bg-list)",
          boxShadow: "0 1px 3px var(--sf-shadow-strong)",
        }}
      >
        {index}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--sf-text)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 11, color: "var(--sf-text-muted)", marginTop: 1 }}>
          {count} opportunit{count === 1 ? "y" : "ies"}
          {distance != null ? ` · ${formatMiles(distance)}` : ""}
        </div>
      </div>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          color: "var(--sf-text-muted)",
          fontSize: 11,
          width: 16,
          height: 16,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          transition: "transform 120ms ease",
        }}
      >
        ▾
      </span>
    </button>
  );
}

function ListingRow({
  listing,
  active,
  distance,
  onClick,
}: {
  listing: Listing;
  active: boolean;
  distance?: number;
  onClick: () => void;
}) {
  // Map category names to pill background/text for colored tagging.
  const catStyle = (cat: string): React.CSSProperties => {
    if (cat === "Food Security")
      return { background: "var(--c-amber-bg)", color: "var(--c-amber-t)" };
    if (cat === "Education" || cat === "Environment" || cat === "Events" || cat === "Immigrant Services")
      return { background: "var(--c-teal-bg)", color: "var(--c-teal-t)" };
    if (cat === "Animals" || cat === "Arts/History")
      return { background: "var(--c-rose-bg)", color: "var(--c-rose-t)" };
    return { background: "var(--sf-pill-track)", color: "var(--sf-text-soft)" };
  };
  const tagBase: React.CSSProperties = {
    borderRadius: 999,
    padding: "3px 9px",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  };

  const notes: string[] = [];
  if (distance != null) notes.push(formatMiles(distance));
  else if (listing.distance) notes.push(listing.distance);
  if (!listing.accepting) notes.push("waitlist");

  return (
    <button
      id={`row-${listing.id}`}
      onClick={onClick}
      style={{
        display: "block",
        width: "calc(100% - 14px)",
        textAlign: "left",
        font: "inherit",
        color: "var(--sf-text)",
        cursor: "pointer",
        background: listing.priority ? "var(--sf-priority-bg)" : "var(--sf-surface)",
        borderTop: `1.5px solid ${active ? "var(--sf-pu)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderRight: `1.5px solid ${active ? "var(--sf-pu)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderBottom: `1.5px solid ${active ? "var(--sf-pu)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderLeft: listing.priority
          ? "4px solid var(--sf-priority-accent)"
          : `1.5px solid ${active ? "var(--sf-pu)" : "var(--sf-border)"}`,
        boxShadow: active ? "0 4px 18px var(--sf-shadow)" : "none",
        transition: "box-shadow 0.18s, border-color 0.18s",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 6,
        marginLeft: 14,
        boxShadow: active ? "0 1px 4px var(--sf-shadow)" : "none",
      }}
    >
      {listing.priority && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "var(--sf-priority-accent)",
            color: "#ffffff",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          ★ Top priority
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "var(--sf-text)",
            lineHeight: 1.25,
            minWidth: 0,
          }}
        >
          {listing.title}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
        {listing.category.map((t) => (
          <span key={t} style={{ ...tagBase, ...catStyle(t) }}>
            {t}
          </span>
        ))}
        {(listing.ageMin != null || listing.ageMax != null) && (
          <span style={{ ...tagBase, background: "var(--c-amber-bg)", color: "var(--c-amber-t)" }}>
            {listing.ageMin != null && listing.ageMax != null
              ? `${listing.ageMin}–${listing.ageMax}`
              : listing.ageMin != null
                ? `${listing.ageMin}+`
                : `≤${listing.ageMax}`}
          </span>
        )}
        {listing.schedule && (
          <span style={{ ...tagBase, background: "var(--sf-pu-l)", color: "var(--sf-pu)" }}>
            {listing.schedule}
          </span>
        )}
        {listing.nearTransit && (
          <span style={{ ...tagBase, background: "var(--c-blue-bg)", color: "var(--c-blue-t)" }}>
            🚌 Near transit
          </span>
        )}
        {listing.signsHourForms && (
          <span style={{ ...tagBase, background: "var(--sf-gr-l)", color: "var(--sf-gr-d)" }}>
            Signs hours
          </span>
        )}
        {listing.groupsOK && (
          <span style={{ ...tagBase, background: "var(--sf-pu-l)", color: "var(--sf-pu)" }}>
            Groups OK
          </span>
        )}
      </div>

      {notes.length > 0 && (
        <div style={{ color: "var(--sf-text-muted)", fontSize: 12, marginTop: 8 }}>
          {notes.join(" · ")}
        </div>
      )}
      {active && (
        <div style={{ color: "var(--sf-pu)", fontSize: 12, fontWeight: 700, marginTop: 7 }}>
          Click again for full details →
        </div>
      )}
    </button>
  );
}

// 1.5 → "1–2 hours" (treat fractional values as a range).
function formatShiftHours(h?: number): string | undefined {
  if (h == null) return undefined;
  if (Number.isInteger(h)) return `${h} hour${h === 1 ? "" : "s"}`;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return `${lo}–${hi} hours`;
}

type Tone = "amber" | "teal" | "blue" | "rose" | "violet" | "green" | "plain";

// Resolve a tone to (background, border, text) CSS vars.
function toneColors(tone: Tone): { bg: string; border: string; text: string } {
  switch (tone) {
    case "amber":
      return { bg: "var(--c-amber-bg)", border: "var(--c-amber-bg)", text: "var(--c-amber-t)" };
    case "teal":
      return { bg: "var(--c-teal-bg)",  border: "var(--c-teal-bg)",  text: "var(--c-teal-t)" };
    case "blue":
      return { bg: "var(--c-blue-bg)",  border: "var(--c-blue-bg)",  text: "var(--c-blue-t)" };
    case "rose":
      return { bg: "var(--c-rose-bg)",  border: "var(--c-rose-bg)",  text: "var(--c-rose-t)" };
    case "violet":
      return { bg: "var(--sf-pu-l)",    border: "var(--sf-pu-l)",    text: "var(--sf-pu)" };
    case "green":
      return { bg: "var(--sf-gr-l)",    border: "var(--sf-gr-l)",    text: "var(--sf-gr-d)" };
    default:
      return { bg: "var(--sf-pill-track)", border: "var(--sf-border)", text: "var(--sf-text-soft)" };
  }
}

// Single cell in the 4-up summary bar at the top of the detail view.
function SumCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const c = toneColors(tone);
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "10px 8px",
        borderRight: "1px solid var(--sf-border-soft)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: c.text,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--sf-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Colored category pill used in the tag row.
function Pill({ label, tone = "plain" }: { label: string; tone?: Tone }) {
  const c = toneColors(tone);
  return (
    <span
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// Numbered colored dot used in the "How to start" steps.
function Dot({ tone, n }: { tone: Tone; n: number }) {
  const c = toneColors(tone);
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 999,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

// Two-letter org initials. "Tri-City Volunteers" → "TC".
function orgInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function DetailView({
  listing,
  distance,
  orgOppCount,
  onBack,
}: {
  listing: Listing;
  distance?: number;
  orgOppCount: number;
  onBack: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const org = listing.org.replace(" - Placeholder", "");
  const startUrl = listing.howToStartUrl ?? listing.website;
  const isMailto = startUrl?.startsWith("mailto:") ?? false;
  const link = (url: string) =>
    url.startsWith("http") || url.startsWith("mailto:") ? url : `https://${url}`;
  const shiftLen = formatShiftHours(listing.shiftLengthHours);

  const ageLabel =
    listing.ageMin != null
      ? `${listing.ageMin}+`
      : listing.ageMax != null
      ? `≤${listing.ageMax}`
      : "Any";

  const goodToKnow: string[] = [];
  if (listing.scheduleNotes) goodToKnow.push(listing.scheduleNotes);
  if (listing.transitNotes) goodToKnow.push(listing.transitNotes);
  else if (listing.nearTransit) goodToKnow.push("Near transit.");
  if (listing.onboardingTime)
    goodToKnow.push(`Time to start: ${listing.onboardingTime}.`);
  if (shiftLen) goodToKnow.push(`Typical shift: ${shiftLen}.`);
  if (listing.groupsOK) goodToKnow.push("Groups and clubs welcome.");

  const steps =
    listing.howToStartSteps && listing.howToStartSteps.length > 0
      ? listing.howToStartSteps
      : [
          `Reach out to ${org || "the organization"} to introduce yourself.`,
          listing.accepting
            ? "They're accepting volunteers now — go ahead and sign up."
            : "They're currently waitlisting — ask to be added.",
        ];
  const stepTones: Tone[] = ["green", "teal", "violet", "amber"];

  const ctaLabel = isMailto
    ? "Email to sign up"
    : listing.accepting
    ? "Open sign-up page"
    : "Join the waitlist";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--sf-bg)",
      }}
    >
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 24px" }}>
        {/* Top row: back + verified pill */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <button
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              color: "var(--sf-text-soft)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: "5px 8px 5px 4px",
              borderRadius: 8,
              marginLeft: -4,
            }}
          >
            ← {org || "Back"} · {orgOppCount} opportunit{orgOppCount === 1 ? "y" : "ies"}
          </button>
          <VerifiedBadge verified={listing.verified} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.2,
            color: "var(--sf-text)",
          }}
        >
          {listing.title}
        </h2>

        {/* Org line: initials chip + name */}
        {org && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              fontSize: 13,
              color: "var(--sf-text-soft)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 7,
                background: "var(--sf-pu-l)",
                color: "var(--sf-pu)",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {orgInitials(org)}
            </span>
            <span>
              Hosted by <span style={{ color: "var(--sf-text)" }}>{org}</span>
            </span>
          </div>
        )}

        {/* Summary bar */}
        <div
          style={{
            display: "flex",
            marginTop: 14,
            border: "1px solid var(--sf-border)",
            borderRadius: 12,
            background: "var(--sf-surface)",
            overflow: "hidden",
          }}
        >
          <SumCell label="⏰ Shifts"   value={listing.schedule ?? "Flexible"}                 tone="teal"   />
          <SumCell label="👤 Min age"  value={ageLabel}                                        tone="violet" />
          <SumCell label="📍 Distance" value={distance != null ? formatMiles(distance) : "—"}  tone="amber"  />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SumCell label="📋 Hours" value={shiftLen ?? "Flexible"} tone="green" />
          </div>
        </div>

        {/* Tag pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
          }}
        >
          {listing.category.map((t) => (
            <Pill key={t} label={t} tone="plain" />
          ))}
          {listing.signsHourForms && <Pill label="Signs hours" tone="green" />}
          {listing.nearTransit && <Pill label="Near transit" tone="teal" />}
          {listing.groupsOK && <Pill label="Groups OK" tone="violet" />}
        </div>

        {/* Next-session callout */}
        {listing.nextSession && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: "var(--sf-callout-bg)",
              border: "1px solid var(--sf-callout-border)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--sf-callout-text)",
            }}
          >
            <strong style={{ color: "var(--sf-callout-strong)" }}>
              Next session:
            </strong>{" "}
            {listing.nextSession}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--sf-text-soft)",
              marginTop: 16,
            }}
          >
            {listing.description}
          </p>
        )}

        {/* What to know */}
        {goodToKnow.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--sf-text-muted)",
                margin: "0 0 8px",
              }}
            >
              What to know
            </h3>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {goodToKnow.map((item, i) => {
                const dotTones: Tone[] = ["teal", "amber", "violet", "green", "blue", "rose"];
                const c = toneColors(dotTones[i % dotTones.length]);
                return (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 9,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "var(--sf-text-soft)",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: c.bg,
                        color: c.text,
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      i
                    </span>
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* How to start */}
        <div style={{ marginTop: 20 }}>
          <h3
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--sf-text-muted)",
              margin: "0 0 10px",
            }}
          >
            How to start
          </h3>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: "var(--sf-text)",
                  alignItems: "flex-start",
                }}
              >
                <Dot tone={stepTones[i % stepTones.length]} n={i + 1} />
                <span style={{ paddingTop: 1 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Hosted by org card */}
        {org && (
          <div
            style={{
              marginTop: 22,
              border: "1px solid var(--sf-border)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--sf-surface)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                borderRadius: 11,
                background: "var(--sf-pu-l)",
                color: "var(--sf-pu)",
                fontSize: 15,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {orgInitials(org)}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--sf-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {org}
              </div>
              <div style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>
                {orgOppCount} active{" "}
                {orgOppCount === 1 ? "opportunity" : "opportunities"}
              </div>
            </div>
          </div>
        )}

        {/* Report a problem footer */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: "1px solid var(--sf-border-soft)",
            textAlign: "center",
          }}
        >
          <a
            href={
              REPORT_PROBLEM_URL.startsWith("mailto:")
                ? `${REPORT_PROBLEM_URL}?subject=${encodeURIComponent(
                    `ServeFremont: problem with "${listing.title}" — ${org}`,
                  )}`
                : `${REPORT_PROBLEM_URL}?usp=pp_url&entry.listing=${encodeURIComponent(
                    `${listing.title} — ${org}`,
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: "var(--sf-text-muted)",
              textDecoration: "underline",
            }}
          >
            Found incorrect info? Report a problem →
          </a>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div
        style={{
          borderTop: "1px solid var(--sf-border)",
          background: "var(--sf-bg)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: listing.accepting
                ? "var(--sf-green-text)"
                : "var(--sf-warn-text)",
            }}
          >
            {listing.accepting ? "Accepting volunteers" : "Waitlist open"}
          </div>
          <div style={{ fontSize: 11, color: "var(--sf-text-muted)" }}>
            {listing.signsHourForms ? "Signs hour forms" : "Hours not signed"}
          </div>
        </div>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Remove from saved" : "Save for later"}
          aria-pressed={saved}
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            border: `1.5px solid ${saved ? "var(--sf-pu)" : "var(--sf-border)"}`,
            background: "var(--sf-surface)",
            color: saved ? "var(--sf-pu)" : "var(--sf-text-muted)",
            fontSize: 18,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          {saved ? "♥" : "♡"}
        </button>
        {startUrl ? (
          <a
            href={link(startUrl)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "var(--sf-pu)",
              color: "#ffffff",
              borderRadius: 11,
              padding: "10px 20px",
              fontSize: 14.5,
              fontWeight: 700,
              textDecoration: "none",
              flexShrink: 0,
              transition: "filter 0.18s",
            }}
          >
            {ctaLabel}
          </a>
        ) : (
          <span
            style={{
              border: "1px dashed var(--sf-border)",
              borderRadius: 11,
              padding: "10px 18px",
              fontSize: 13,
              color: "var(--sf-text-muted)",
              flexShrink: 0,
            }}
          >
            Contact directly
          </span>
        )}
      </div>
    </div>
  );
}
