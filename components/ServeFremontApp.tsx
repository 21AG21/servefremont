"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// Display face for the wordmark, org names, detail titles, and the
// verification stamp — the site's serif voice (see layout.tsx).
const SERIF = "var(--font-fraunces), Georgia, serif";

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
  // dataset attribute from the OS preference before paint. Server and first
  // client render both use "light" so hydration matches; after mount we adopt
  // the script's value, and only user toggles write back to the DOM.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const themeSynced = useRef(false);
  useEffect(() => {
    if (!themeSynced.current) {
      themeSynced.current = true;
      const fromDom =
        document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      if (fromDom !== theme) setTheme(fromDom);
      return;
    }
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
        border: `1px solid ${on ? "var(--sf-accent)" : "var(--sf-input-border)"}`,
        borderRadius: 8,
        padding: "5px 12px",
        fontSize: 13,
        fontWeight: on ? 600 : 400,
        background: on ? "var(--sf-accent)" : "transparent",
        color: on ? "var(--sf-on-accent)" : "var(--sf-text-soft)",
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
        fontFamily: "var(--font-inter), system-ui, sans-serif",
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
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            ServeFremont
          </span>
          {!isMobile && (
            <span
              style={{
                fontSize: 12,
                color: "var(--sf-text-muted)",
                borderLeft: "1px solid var(--sf-border)",
                paddingLeft: 10,
                marginLeft: 2,
              }}
            >
              Volunteer spots in Fremont, verified in person
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
              background: "transparent",
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
              fontWeight: 500,
              border: "1px solid var(--sf-input-border)",
              borderRadius: 8,
              padding: "6px 14px",
              background: "transparent",
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

// The verification stamp — set in the serif italic so it reads like an
// actual stamp, not another pill. This is the site's trust mark.
function VerifiedBadge({ verified }: { verified?: string }) {
  if (!verified) return null;
  return (
    <span
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 500,
        color: "var(--sf-accent-ink)",
        border: "1px solid var(--sf-accent-border)",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11.5,
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
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: active ? "var(--sf-accent)" : "var(--sf-surface)",
          color: active ? "var(--sf-on-accent)" : "var(--sf-text-soft)",
          fontSize: 12,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.5px solid ${active ? "var(--sf-accent)" : "var(--sf-input-border)"}`,
        }}
      >
        {index}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 15.5,
            fontWeight: 600,
            color: "var(--sf-text)",
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
  // Quiet outlined chips — color is reserved for information that changes
  // a student's decision (hour forms), not decoration.
  const tagBase: React.CSSProperties = {
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 450,
    whiteSpace: "nowrap" as const,
    border: "1px solid var(--sf-border)",
    background: "transparent",
    color: "var(--sf-text-soft)",
  };
  const tagAccent: React.CSSProperties = {
    ...tagBase,
    border: "1px solid var(--sf-accent-border)",
    background: "var(--sf-accent-soft)",
    color: "var(--sf-accent-ink)",
    fontWeight: 500,
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
        borderTop: `1px solid ${active ? "var(--sf-accent)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderRight: `1px solid ${active ? "var(--sf-accent)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderBottom: `1px solid ${active ? "var(--sf-accent)" : listing.priority ? "var(--sf-priority-border)" : "var(--sf-border)"}`,
        borderLeft: listing.priority
          ? "3px solid var(--sf-priority-accent)"
          : `1px solid ${active ? "var(--sf-accent)" : "var(--sf-border)"}`,
        boxShadow: active ? "0 0 0 1px var(--sf-accent), 0 3px 14px var(--sf-shadow)" : "0 1px 2px var(--sf-shadow)",
        transition: "box-shadow 0.18s, border-color 0.18s",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 8,
        marginLeft: 14,
      }}
    >
      {listing.priority && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: "var(--sf-priority-text)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          <span style={{ color: "var(--sf-priority-accent)" }}>★</span> Top priority
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
            fontWeight: 600,
            fontSize: 15,
            color: "var(--sf-text)",
            lineHeight: 1.3,
            minWidth: 0,
          }}
        >
          {listing.title}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
        {listing.signsHourForms && (
          <span style={tagAccent}>✓ Signs hours</span>
        )}
        {listing.category.map((t) => (
          <span key={t} style={tagBase}>
            {t}
          </span>
        ))}
        {(listing.ageMin != null || listing.ageMax != null) && (
          <span style={tagBase}>
            {listing.ageMin != null && listing.ageMax != null
              ? `Ages ${listing.ageMin}–${listing.ageMax}`
              : listing.ageMin != null
                ? `Ages ${listing.ageMin}+`
                : `Ages ≤${listing.ageMax}`}
          </span>
        )}
        {listing.schedule && <span style={tagBase}>{listing.schedule}</span>}
        {listing.nearTransit && <span style={tagBase}>Near transit</span>}
        {listing.groupsOK && <span style={tagBase}>Groups OK</span>}
      </div>

      {notes.length > 0 && (
        <div style={{ color: "var(--sf-text-muted)", fontSize: 12, marginTop: 8 }}>
          {notes.join(" · ")}
        </div>
      )}
      {active && (
        <div style={{ color: "var(--sf-accent)", fontSize: 12, fontWeight: 600, marginTop: 7 }}>
          Open full details →
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

// Single cell in the 4-up summary bar at the top of the detail view.
function SumCell({ label, value }: { label: string; value: string }) {
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
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--sf-text-muted)",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
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

// Chip used in the detail tag row. Accent is reserved for hour-form signing.
function Pill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        background: accent ? "var(--sf-accent-soft)" : "transparent",
        border: `1px solid ${accent ? "var(--sf-accent-border)" : "var(--sf-border)"}`,
        color: accent ? "var(--sf-accent-ink)" : "var(--sf-text-soft)",
        borderRadius: 6,
        padding: "3px 9px",
        fontSize: 12,
        fontWeight: accent ? 500 : 450,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// Numbered dot used in the "How to start" steps.
function Dot({ n }: { n: number }) {
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
        background: "var(--sf-accent-soft)",
        border: "1px solid var(--sf-accent-border)",
        color: "var(--sf-accent-ink)",
        fontSize: 11,
        fontWeight: 600,
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
            fontFamily: SERIF,
            fontSize: 26,
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
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
                borderRadius: 6,
                background: "var(--sf-accent-soft)",
                color: "var(--sf-accent-ink)",
                fontSize: 10,
                fontWeight: 600,
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
          <SumCell label="Schedule" value={listing.schedule ?? "Flexible"} />
          <SumCell label="Min age" value={ageLabel} />
          <SumCell label="Distance" value={distance != null ? formatMiles(distance) : "—"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SumCell label="Shift" value={shiftLen ?? "Flexible"} />
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
          {listing.signsHourForms && <Pill label="✓ Signs hour forms" accent />}
          {listing.category.map((t) => (
            <Pill key={t} label={t} />
          ))}
          {listing.nearTransit && <Pill label="Near transit" />}
          {listing.groupsOK && <Pill label="Groups OK" />}
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
              {goodToKnow.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    color: "var(--sf-text-soft)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 999,
                      background: "var(--sf-gold)",
                      marginTop: 8,
                      flexShrink: 0,
                    }}
                  />
                  <span>{item}</span>
                </li>
              ))}
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
                <Dot n={i + 1} />
                <span style={{ paddingTop: 2 }}>{step}</span>
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
                borderRadius: 10,
                background: "var(--sf-accent-soft)",
                color: "var(--sf-accent-ink)",
                fontFamily: SERIF,
                fontSize: 15,
                fontWeight: 600,
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
          background: "var(--sf-surface)",
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
                ? "var(--sf-accent-ink)"
                : "var(--sf-gold-ink)",
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
            width: 42,
            height: 42,
            borderRadius: 10,
            border: `1px solid ${saved ? "var(--sf-accent)" : "var(--sf-input-border)"}`,
            background: saved ? "var(--sf-accent-soft)" : "transparent",
            color: saved ? "var(--sf-accent-ink)" : "var(--sf-text-muted)",
            fontSize: 17,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s, background 0.15s",
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
              background: "var(--sf-accent)",
              color: "var(--sf-on-accent)",
              borderRadius: 10,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 600,
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
              border: "1px dashed var(--sf-input-border)",
              borderRadius: 10,
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
