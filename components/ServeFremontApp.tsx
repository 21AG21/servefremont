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

// The one face used throughout this screen — renders as real San Francisco
// on Apple devices, Inter (licensed, next/font-loaded) everywhere else.
// No serif, no second display face: wordmark, titles, and "Verified" are
// all plain UI type now.
const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

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
  // Which dropdown-facet menu is open (Civic Block v2 filter bar). One at a time.
  const [openFacet, setOpenFacet] = useState<
    "age" | "cause" | "schedule" | "req" | "status" | null
  >(null);
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

  const anyFilter =
    activeAge != null ||
    filters.categories.length > 0 ||
    filters.schedules.length > 0 ||
    filters.requirements.length > 0 ||
    filters.statuses.length > 0;

  const clearAll = () => {
    setActiveAge(null);
    setFilters(EMPTY);
    setOpenFacet(null);
  };

  // Dropdown-facet button, moderate rounding — green when the facet has a
  // selection.
  const ddStyle = (on: boolean): React.CSSProperties => ({
    fontFamily: UI,
    fontSize: 12.5,
    fontWeight: on ? 600 : 500,
    padding: "6px 11px",
    borderRadius: 7,
    border: `1px solid ${on ? "var(--sf-accent)" : "var(--sf-border)"}`,
    color: on ? "var(--sf-accent-ink)" : "var(--sf-text-soft)",
    background: on ? "var(--sf-accent-soft)" : "var(--sf-surface)",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  });

  const menuStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 3px)",
    left: 0,
    width: 200,
    background: "var(--sf-surface)",
    border: "1px solid var(--sf-border)",
    borderRadius: 7,
    boxShadow: "0 10px 28px var(--sf-shadow-strong)",
    padding: 5,
    zIndex: 50,
  };

  const menuRow = (
    key: string,
    label: string,
    on: boolean,
    onClick: () => void
  ) => (
    <button
      key={key}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 8px",
        width: "100%",
        border: "none",
        borderRadius: 6,
        background: on ? "var(--sf-accent-soft)" : "none",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: UI,
        fontSize: 12.5,
        fontWeight: on ? 600 : 400,
        color: on ? "var(--sf-accent-ink)" : "var(--sf-text-soft)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          flexShrink: 0,
          border: `1.5px solid ${on ? "var(--sf-accent)" : "var(--sf-border)"}`,
          background: on ? "var(--sf-accent)" : "transparent",
          color: "var(--sf-on-accent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
        }}
      >
        {on ? "✓" : ""}
      </span>
      {label}
    </button>
  );

  const facet = (
    id: NonNullable<typeof openFacet>,
    label: string,
    on: boolean,
    rows: React.ReactNode
  ) => (
    <span style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpenFacet((f) => (f === id ? null : id))}
        style={ddStyle(on)}
      >
        {label}
        <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>
          ▾
        </span>
      </button>
      {openFacet === id && <div style={menuStyle}>{rows}</div>}
    </span>
  );

  const filterFacets = (
    <>
      {facet(
        "age",
        activeAge != null ? `Age: ${activeAge}` : "Age",
        activeAge != null,
        AGES.map((a) =>
          menuRow(`age-${a}`, `${a}${a === 18 ? "+" : ""}`, activeAge === a, () =>
            setActiveAge(activeAge === a ? null : a)
          )
        )
      )}
      {facet(
        "cause",
        filters.categories.length
          ? `Cause: ${filters.categories.length}`
          : "Cause",
        filters.categories.length > 0,
        categories.length ? (
          categories.map((c) =>
            menuRow(`cat-${c}`, c, filters.categories.includes(c), () =>
              setFilters((f) => ({ ...f, categories: toggle(f.categories, c) }))
            )
          )
        ) : (
          <div
            style={{
              padding: "7px 8px",
              fontFamily: UI,
              fontSize: 12.5,
              color: "var(--sf-text-muted)",
            }}
          >
            No categories yet
          </div>
        )
      )}
      {facet(
        "schedule",
        filters.schedules.length
          ? `Schedule: ${filters.schedules.length}`
          : "Schedule",
        filters.schedules.length > 0,
        SCHEDULES.map((s) =>
          menuRow(`sch-${s}`, s, filters.schedules.includes(s), () =>
            setFilters((f) => ({ ...f, schedules: toggle(f.schedules, s) }))
          )
        )
      )}
      {facet(
        "req",
        filters.requirements.length
          ? `Requirements: ${filters.requirements.length}`
          : "Requirements",
        filters.requirements.length > 0,
        REQUIREMENTS.map((r) =>
          menuRow(
            `req-${r.key}`,
            r.label,
            filters.requirements.includes(r.key),
            () =>
              setFilters((f) => ({
                ...f,
                requirements: toggle(f.requirements, r.key),
              }))
          )
        )
      )}
      {facet(
        "status",
        filters.statuses.length ? `Status: ${filters.statuses.length}` : "Status",
        filters.statuses.length > 0,
        STATUSES.map((s) =>
          menuRow(`st-${s.key}`, s.label, filters.statuses.includes(s.key), () =>
            setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s.key) }))
          )
        )
      )}
      {anyFilter && (
        <button
          onClick={clearAll}
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--sf-accent)",
            background: "none",
            border: "none",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
            marginLeft: 2,
            flexShrink: 0,
          }}
        >
          Clear all
        </button>
      )}
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
      {/* Click-away layer for open facet menus */}
      {openFacet && (
        <div
          onClick={() => setOpenFacet(null)}
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
        />
      )}

      {/* Top bar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: isMobile ? "10px 16px" : "15px 22px",
          borderBottom: "1px solid var(--sf-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="/logo.svg"
            alt=""
            width={isMobile ? 19 : 22}
            height={isMobile ? 19 : 22}
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: UI,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--sf-text)",
            }}
          >
            ServeFremont
          </span>
          {!isMobile && (
            <span
              style={{
                fontFamily: UI,
                fontSize: 12,
                color: "var(--sf-text-muted)",
                borderLeft: "1px solid var(--sf-border)",
                paddingLeft: 11,
                marginLeft: 2,
              }}
            >
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
              fontFamily: UI,
              fontSize: isMobile ? 14 : 12,
              fontWeight: 500,
              lineHeight: 1,
              border: "1px solid var(--sf-border)",
              borderRadius: isMobile ? 8 : 7,
              padding: isMobile ? "7px" : "6px 12px",
              width: isMobile ? 32 : undefined,
              height: isMobile ? 32 : undefined,
              display: isMobile ? "inline-flex" : undefined,
              alignItems: isMobile ? "center" : undefined,
              justifyContent: isMobile ? "center" : undefined,
              background: "var(--sf-surface)",
              color: "var(--sf-text-soft)",
              cursor: "pointer",
            }}
          >
            {isMobile
              ? theme === "dark"
                ? "☀"
                : "☾"
              : theme === "dark"
                ? "Light mode"
                : "Dark mode"}
          </button>
          <button
            onClick={() => setShowMap((v) => !v)}
            style={{
              fontFamily: UI,
              fontSize: isMobile ? 12.5 : 12,
              fontWeight: isMobile ? 600 : 500,
              border: `1px solid ${isMobile && showMap === false ? "var(--sf-accent)" : "var(--sf-border)"}`,
              borderRadius: isMobile ? 8 : 7,
              padding: isMobile ? "7px 13px" : "6px 12px",
              background:
                !isMobile && !showMap ? "var(--sf-accent-soft)" : "var(--sf-surface)",
              color: !isMobile && !showMap ? "var(--sf-accent-ink)" : "var(--sf-text-soft)",
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
          padding: isMobile ? "9px 16px" : "11px 22px",
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

      {/* Filter bar — one-line dropdown facets */}
      <div
        style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 45,
          padding: isMobile ? "9px 16px" : "9px 22px",
          borderBottom: "1px solid var(--sf-border)",
        }}
      >
        {isMobile ? (
          <div
            className="filter-scroll"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {filterFacets}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {filterFacets}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left column: list OR detail — hidden on mobile when map is showing */}
        <div
          style={{
            flex: 1,
            display: isMobile && showMap ? "none" : undefined,
            minWidth: 0,
            overflowY: detail ? "hidden" : "auto",
            background: detail ? "var(--sf-bg)" : "var(--sf-bg-list)",
            padding: detail
              ? 0
              : isMobile
                ? "13px 16px"
                : !showMap
                  ? "20px 28px"
                  : "15px 20px",
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
          ) : (() => {
            const useGrid = !showMap && !isMobile;
            const items = orgGroups.flatMap((group, gi) => {
              const orgActive = group.listings.some((l) => l.id === activeId);
              const orgDistance =
                group.lat != null && group.lng != null && userLoc
                  ? distances.get(group.listings[0].id)
                  : undefined;
              const isCollapsed = collapsed.has(group.orgName);
              const nodes: React.ReactNode[] = [];
              nodes.push(
                <div
                  key={`org-${group.orgName}`}
                  style={{
                    gridColumn: useGrid ? "1 / -1" : undefined,
                    marginTop: gi > 0 && !useGrid ? 0 : undefined,
                    marginBottom: useGrid ? -4 : 0,
                  }}
                >
                  <OrgHeader
                    index={gi + 1}
                    name={group.orgName}
                    count={group.listings.length}
                    distance={orgDistance}
                    active={orgActive}
                    collapsed={isCollapsed}
                    onToggle={() => toggleOrg(group.orgName)}
                  />
                </div>
              );
              if (!isCollapsed) {
                for (const l of group.listings) {
                  nodes.push(
                    <ListingRow
                      key={l.id}
                      listing={l}
                      active={l.id === activeId}
                      distance={distances.get(l.id)}
                      flushLeft={useGrid || isMobile}
                      onClick={() => {
                        if (activeId === l.id) setDetailId(l.id);
                        else setActiveId(l.id);
                      }}
                    />
                  );
                }
              }
              return nodes;
            });
            return (
              <div
                style={
                  useGrid
                    ? {
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px 20px",
                        maxWidth: 980,
                        margin: "0 auto",
                      }
                    : undefined
                }
              >
                {items}
              </div>
            );
          })()}
        </div>

        {/* Map — full-bleed on mobile; on desktop it never fully disappears:
            flex:1.3 alongside the list, or a slim 210px rail when "hidden"
            so the list can reflow into a 2-column grid without losing
            spatial orientation. */}
        {(showMap || !isMobile) && (
          <div
            style={{
              flex: isMobile ? 1 : showMap ? 1.3 : undefined,
              width: !isMobile && !showMap ? 210 : undefined,
              flexShrink: !isMobile && !showMap ? 0 : undefined,
              minWidth: 0,
              position: "relative",
              borderLeft:
                !isMobile && !showMap ? "1px solid var(--sf-border)" : undefined,
            }}
          >
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

// Quiet plain-text verification mark — no chip, no stamp. Trust comes from
// legibility and consistency, not decoration.
function VerifiedBadge({ verified }: { verified?: string }) {
  if (!verified) return null;
  return (
    <span
      style={{
        flexShrink: 0,
        fontFamily: UI,
        fontWeight: 500,
        color: "var(--sf-accent-ink)",
        fontSize: 11.5,
        whiteSpace: "nowrap",
      }}
    >
      Verified {verified}
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
          width: 24,
          height: 24,
          borderRadius: 5,
          background: active ? "var(--sf-accent)" : "var(--sf-surface)",
          color: active ? "var(--sf-on-accent)" : "var(--sf-text-soft)",
          fontSize: 11.5,
          fontFamily: UI,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1.5px solid ${active ? "var(--sf-accent)" : "var(--sf-border-strong)"}`,
        }}
      >
        {index}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: UI,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--sf-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--sf-text-muted)", marginTop: 1 }}>
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
  flushLeft,
  onClick,
}: {
  listing: Listing;
  active: boolean;
  distance?: number;
  // True in the 2-col grid (map hidden) and on mobile — both drop the
  // org-relative 36px indent since there's no room/reason to keep it.
  flushLeft?: boolean;
  onClick: () => void;
}) {
  // Quiet outlined chips — color is reserved for information that changes
  // a student's decision (hour forms), not decoration.
  const tagBase: React.CSSProperties = {
    borderRadius: 5,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 500,
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
  };

  const notes: string[] = [];
  if (distance != null) notes.push(formatMiles(distance));
  else if (listing.distance) notes.push(listing.distance);
  if (!listing.accepting) notes.push("waitlist");

  const borderColor = active
    ? "var(--sf-accent)"
    : listing.priority
      ? "var(--sf-priority-border)"
      : "var(--sf-outline)";

  return (
    <button
      id={`row-${listing.id}`}
      onClick={onClick}
      style={{
        display: "block",
        width: flushLeft ? "100%" : "calc(100% - 36px)",
        textAlign: "left",
        font: "inherit",
        color: "var(--sf-text)",
        cursor: "pointer",
        background: listing.priority ? "var(--sf-priority-bg)" : "var(--sf-surface)",
        borderTop: `1.5px solid ${borderColor}`,
        borderRight: `1.5px solid ${borderColor}`,
        borderBottom: `1.5px solid ${borderColor}`,
        borderLeft: active
          ? "3px solid var(--sf-accent)"
          : listing.priority
            ? "3px solid var(--sf-priority-accent)"
            : `1.5px solid ${borderColor}`,
        boxShadow: active
          ? "0 4px 16px var(--sf-shadow)"
          : "0 1px 3px var(--sf-shadow)",
        transition: "box-shadow 0.18s, border-color 0.18s",
        borderRadius: 10,
        padding: "13px 15px",
        marginBottom: 9,
        marginLeft: flushLeft ? 0 : 36,
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
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 7,
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
            fontFamily: UI,
            fontWeight: 600,
            fontSize: 14.5,
            color: "var(--sf-text)",
            lineHeight: 1.3,
            minWidth: 0,
          }}
        >
          {listing.title}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
        {listing.signsHourForms && (
          <span style={tagAccent}>Signs hours</span>
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
      <div
        style={{
          marginTop: 9,
          fontFamily: UI,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--sf-accent)",
        }}
      >
        More info →
      </div>
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
            fontFamily: UI,
            fontSize: 22,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.2,
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
            borderRadius: 10,
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
              borderRadius: 10,
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
                fontFamily: UI,
                fontSize: 14,
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
