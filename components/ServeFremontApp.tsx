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

// Where the "Report a problem" link in the detail view sends the user. Mailto
// today; swap to a Google Form URL once one is set up — only this constant
// needs to change.
const REPORT_PROBLEM_URL = "mailto:gandhi.kunal@gmail.com";

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
        border: `1.5px solid ${on ? "var(--sf-active-bg)" : "var(--sf-input-border)"}`,
        borderRadius: 20,
        padding: "6px 13px",
        fontSize: 13,
        background: on ? "var(--sf-active-bg)" : "var(--sf-surface)",
        color: on ? "var(--sf-active-text)" : "var(--sf-text-soft)",
        cursor: "pointer",
        whiteSpace: "nowrap",
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
            overflowY: "auto",
            background: detail ? "var(--sf-bg)" : "var(--sf-bg-list)",
            padding: detail ? 0 : 14,
          }}
        >
          {detail ? (
            <DetailView
              listing={detail}
              distance={distances.get(detail.id)}
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
        color: "var(--sf-green-text)",
        background: "var(--sf-green-bg)",
        border: "1px solid var(--sf-green-border)",
        borderRadius: 6,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        marginTop: 2,
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
          background: active ? "var(--sf-active-bg)" : "var(--sf-text-soft)",
          color: active ? "var(--sf-active-text)" : "var(--sf-bg)",
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
  const tagStyle: React.CSSProperties = {
    border: "1px solid var(--sf-border)",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 12,
    color: "var(--sf-text-soft)",
    background: "var(--sf-surface)",
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
        background: "var(--sf-surface)",
        border: `1.5px solid ${active ? "var(--sf-active-bg)" : "var(--sf-border)"}`,
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 6,
        marginLeft: 14,
        boxShadow: active ? "0 1px 4px var(--sf-shadow)" : "none",
      }}
    >
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
          <span key={t} style={tagStyle}>
            {t}
          </span>
        ))}
        {(listing.ageMin != null || listing.ageMax != null) && (
          <span style={tagStyle}>
            {listing.ageMin != null && listing.ageMax != null
              ? `${listing.ageMin}–${listing.ageMax}`
              : listing.ageMin != null
                ? `${listing.ageMin}+`
                : `≤${listing.ageMax}`}
          </span>
        )}
        {listing.schedule && <span style={tagStyle}>{listing.schedule}</span>}
        {listing.nearTransit && (
          <span
            style={{
              ...tagStyle,
              border: "1px solid var(--sf-blue-border)",
              background: "var(--sf-blue-bg)",
              color: "var(--sf-blue-text)",
            }}
          >
            🚌 Near transit
          </span>
        )}
        {listing.signsHourForms && (
          <span
            style={{
              ...tagStyle,
              border: "1px solid var(--sf-green-border)",
              background: "var(--sf-green-bg)",
              color: "var(--sf-green-text)",
            }}
          >
            Signs hours
          </span>
        )}
        {listing.groupsOK && (
          <span
            style={{
              ...tagStyle,
              border: "1px solid var(--sf-purple-border)",
              background: "var(--sf-purple-bg)",
              color: "var(--sf-purple-text)",
            }}
          >
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
        <div style={{ color: "var(--sf-text-faint)", fontSize: 11, marginTop: 6 }}>
          Click again for full details →
        </div>
      )}
    </button>
  );
}

function formatAge(min?: number, max?: number): string {
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `${min}+`;
  if (max != null) return `Up to ${max}`;
  return "Any age";
}

// 1.5 → "1–2 hours" (treat fractional values as a range).
function formatShiftHours(h?: number): string | undefined {
  if (h == null) return undefined;
  if (Number.isInteger(h)) return `${h} hour${h === 1 ? "" : "s"}`;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return `${lo}–${hi} hours`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 22 }}>
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
        {title}
      </h3>
      {children}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 0",
        borderBottom: "1px solid var(--sf-border-soft)",
        fontSize: 13,
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: "var(--sf-text-soft)", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--sf-text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function DetailView({
  listing,
  distance,
  onBack,
}: {
  listing: Listing;
  distance?: number;
  onBack: () => void;
}) {
  const org = listing.org.replace(" - Placeholder", "");
  const startUrl = listing.howToStartUrl ?? listing.website;
  const link = (url: string) =>
    url.startsWith("http") ? url : `https://${url}`;
  const shiftLen = formatShiftHours(listing.shiftLengthHours);

  return (
    <div style={{ padding: "16px 20px 28px" }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "none",
          color: "var(--sf-text-soft)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← Back to list
      </button>

      {/* Title block */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.2,
              color: "var(--sf-text)",
            }}
          >
            {listing.title}
          </h2>
          {org && (
            <div style={{ color: "var(--sf-text-muted)", fontSize: 14, marginTop: 4 }}>
              {org}
            </div>
          )}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      {/* Status row: accepting + categories */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <span
          style={{
            border: `1px solid ${
              listing.accepting ? "var(--sf-green-border)" : "var(--sf-warn-border)"
            }`,
            background: listing.accepting
              ? "var(--sf-green-bg)"
              : "var(--sf-warn-bg)",
            color: listing.accepting
              ? "var(--sf-green-text)"
              : "var(--sf-warn-text)",
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {listing.accepting ? "Accepting now" : "Waitlist"}
        </span>
        {listing.category.map((t) => (
          <span
            key={t}
            style={{
              border: "1px solid var(--sf-border)",
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 12,
              color: "var(--sf-text-soft)",
            }}
          >
            {t}
          </span>
        ))}
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
          <strong style={{ color: "var(--sf-callout-strong)" }}>Next session:</strong>{" "}
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

      {/* Who can volunteer */}
      <Section title="Who can volunteer">
        <FactRow label="Age" value={formatAge(listing.ageMin, listing.ageMax)} />
        <FactRow
          label="Signs school hour forms"
          value={listing.signsHourForms ? "Yes" : "No"}
        />
        {listing.groupsOK && (
          <FactRow label="Groups / clubs" value="Welcome" />
        )}
      </Section>

      {/* When & where */}
      <Section title="When & where">
        {listing.schedule && (
          <FactRow label="Schedule" value={listing.schedule} />
        )}
        {listing.scheduleNotes && (
          <FactRow label="Details" value={listing.scheduleNotes} />
        )}
        {shiftLen && <FactRow label="Shift length" value={shiftLen} />}
        {listing.address && (
          <FactRow label="Address" value={listing.address} />
        )}
        {listing.nearTransit && (
          <FactRow
            label="Transit"
            value={listing.transitNotes ?? "Near transit"}
          />
        )}
        {distance != null && (
          <FactRow label="Distance" value={`${formatMiles(distance)} away`} />
        )}
      </Section>

      {/* How to start */}
      <Section title="How to start">
        <ol
          style={{
            margin: "0 0 10px",
            paddingLeft: 20,
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "var(--sf-text)",
          }}
        >
          {listing.howToStartSteps && listing.howToStartSteps.length > 0 ? (
            listing.howToStartSteps.map((step, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {step}
              </li>
            ))
          ) : (
            <>
              <li>Reach out to {org || "the organization"} to introduce yourself.</li>
              {listing.accepting ? (
                <li>They&apos;re accepting volunteers now — go ahead and sign up.</li>
              ) : (
                <li>They&apos;re currently waitlisting — ask to be added.</li>
              )}
            </>
          )}
        </ol>
        {listing.onboardingTime && (
          <p
            style={{
              fontSize: 12,
              color: "var(--sf-text-soft)",
              margin: "0 0 4px",
            }}
          >
            Time to get started: {listing.onboardingTime}
          </p>
        )}
        {startUrl ? (
          <a
            href={link(startUrl)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 12,
              background: "var(--sf-active-bg)",
              color: "var(--sf-active-text)",
              borderRadius: 9,
              padding: "11px 0",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open sign-up page →
          </a>
        ) : (
          <p
            style={{
              marginTop: 12,
              padding: "11px 14px",
              border: "1px dashed var(--sf-border)",
              borderRadius: 9,
              fontSize: 13,
              color: "var(--sf-text-muted)",
              textAlign: "center",
            }}
          >
            Contact the organization directly to begin.
          </p>
        )}
      </Section>

      {/* Report a problem footer */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 14,
          borderTop: "1px solid var(--sf-border-soft)",
          textAlign: "center",
        }}
      >
        <a
          href={
            REPORT_PROBLEM_URL.startsWith("mailto:")
              ? `${REPORT_PROBLEM_URL}?subject=${encodeURIComponent(
                  `ServeFremont: problem with "${listing.title}" — ${org}`
                )}`
              : `${REPORT_PROBLEM_URL}?usp=pp_url&entry.listing=${encodeURIComponent(
                  `${listing.title} — ${org}`
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
  );
}
