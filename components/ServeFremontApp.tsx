"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listing";
import { haversineMiles, formatMiles } from "@/lib/distance";
import AddressBox from "@/components/AddressBox";
import { useIsMobile } from "@/lib/useIsMobile";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => <div style={center("#999")}>Loading map…</div>,
});

const AGES = [13, 14, 15, 16, 17, 18];
const SCHEDULES = ["Recurring", "One-time", "Drop-in"];
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
    if (activeAge != null && l.ageMin != null && l.ageMin > activeAge)
      return false;
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
    if (!userLoc) return filtered;
    return [...filtered].sort((a, b) => {
      const da = distances.get(a.id);
      const db = distances.get(b.id);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  }, [filtered, userLoc, distances]);

  const detail = detailId ? listings.find((l) => l.id === detailId) : null;

  const pill = (label: string, on: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${on ? "#111" : "#e3e3e3"}`,
        borderRadius: 20,
        padding: "6px 13px",
        fontSize: 13,
        background: on ? "#111" : "#fff",
        color: on ? "#fff" : "#555",
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
        background: "#ececec",
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
          background: "#efefef",
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
                color: on ? "#111" : "#888",
                background: on ? "#fff" : "transparent",
                boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
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
        color: "#111",
        background: "#fff",
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
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em" }}>
            ServeFremont
          </span>
          {!isMobile && (
            <span style={{ fontSize: 12, color: "#999" }}>
              Volunteer spots around Fremont, checked in person
            </span>
          )}
        </div>
        <button
          onClick={() => setShowMap((v) => !v)}
          style={{
            fontSize: 13,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            padding: "6px 14px",
            background: "#fff",
            color: "#555",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {isMobile ? (showMap ? "List" : "Map") : showMap ? "Hide map" : "Show map"}
        </button>
      </div>

      {/* Filter bar */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 20px 14px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {isMobile ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <AddressBox
                active={!!userLoc}
                onPick={(loc) => setUserLoc(loc)}
                onClear={() => setUserLoc(null)}
                fullWidth
              />
            </div>
            <div
              className="filter-scroll"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {filterPills}
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <AddressBox
              active={!!userLoc}
              onPick={(loc) => setUserLoc(loc)}
              onClear={() => setUserLoc(null)}
            />
            {divider}
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
            background: detail ? "#fff" : "#f5f5f4",
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
            <p style={{ padding: 6, color: "#999", fontSize: 13 }}>
              Loading opportunities…
            </p>
          ) : error ? (
            <p style={{ padding: 6, color: "#999", fontSize: 13 }}>{error}</p>
          ) : sorted.length === 0 ? (
            <p style={{ padding: 6, color: "#999", fontSize: 13 }}>
              No opportunities match these filters.
            </p>
          ) : (
            sorted.map((l) => (
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
            ))
          )}
        </div>

        {/* Map — full width on mobile, 62% on desktop */}
        {showMap && (
          <div style={{ flex: isMobile ? "1" : "62", minWidth: 0, position: "relative" }}>
            <ListingMap
              listings={sorted}
              activeId={activeId}
              onSelect={setActiveId}
              userLoc={userLoc}
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
        color: "#1a7a34",
        background: "#eef7f0",
        border: "1px solid #d0ecd8",
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
    border: "1px solid #ececec",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 12,
    color: "#555",
    background: "#fff",
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
        width: "100%",
        textAlign: "left",
        font: "inherit",
        color: "#111",
        cursor: "pointer",
        background: "#fff",
        border: `1.5px solid ${active ? "#111" : "#ececec"}`,
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 10,
        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
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
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: "#111",
              lineHeight: 1.25,
            }}
          >
            {listing.title}
          </div>
          {listing.org && (
            <div style={{ color: "#999", fontSize: 13, marginTop: 3 }}>
              {listing.org.replace(" - Placeholder", "")}
            </div>
          )}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
        {listing.category.map((t) => (
          <span key={t} style={tagStyle}>
            {t}
          </span>
        ))}
        {listing.ageMin != null && <span style={tagStyle}>{listing.ageMin}+</span>}
        {listing.schedule && <span style={tagStyle}>{listing.schedule}</span>}
      </div>

      {notes.length > 0 && (
        <div style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
          {notes.join(" · ")}
        </div>
      )}
      {active && (
        <div style={{ color: "#bbb", fontSize: 11, marginTop: 6 }}>
          Click again for full details →
        </div>
      )}
    </button>
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

  const facts: [string, string][] = [];
  facts.push([
    "Age",
    listing.ageMin != null ? `${listing.ageMin} and up` : "Not listed",
  ]);
  if (listing.schedule) facts.push(["Schedule", listing.schedule]);
  facts.push([
    "Hour forms",
    listing.signsHourForms ? "Signs school hour forms" : "Does not sign forms",
  ]);
  facts.push(["Accepting", listing.accepting ? "Yes, now" : "Waitlist"]);
  if (listing.nearTransit) facts.push(["Transit", listing.transitNotes ?? "Near transit"]);
  if (listing.groupsOK) facts.push(["Groups", "Groups or clubs welcome"]);
  if (distance != null) facts.push(["Distance", `${formatMiles(distance)} away`]);
  if (listing.address) facts.push(["Address", listing.address]);

  return (
    <div style={{ padding: "16px 20px" }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "none",
          color: "#555",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 14,
        }}
      >
        ← Back to list
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            {listing.title}
          </h2>
          {org && (
            <div style={{ color: "#999", fontSize: 14, marginTop: 4 }}>{org}</div>
          )}
        </div>
        <VerifiedBadge verified={listing.verified} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        {listing.category.map((t) => (
          <span
            key={t}
            style={{
              border: "1px solid #ececec",
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 12,
              color: "#555",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {listing.description && (
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333", marginTop: 16 }}>
          {listing.description}
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 0 }}>
        {facts.map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "9px 0",
              borderBottom: "1px solid #f0f0f0",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#999" }}>{k}</span>
            <span style={{ color: "#111", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>
        How to start
      </h3>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: "#333" }}>
        {listing.onboarding ? (
          <li>{listing.onboarding}</li>
        ) : (
          <li>Reach out to {org || "the organization"} to introduce yourself.</li>
        )}
        {listing.onboardingTime && <li>Time to get started: {listing.onboardingTime}.</li>}
        <li>Bring your school hour form if you need it signed.</li>
        {listing.accepting ? (
          <li>They&apos;re accepting volunteers now — go ahead and sign up.</li>
        ) : (
          <li>They&apos;re currently waitlisting — ask to be added.</li>
        )}
      </ol>

      {startUrl ? (
        <a
          href={link(startUrl)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 18,
            background: "#111",
            color: "#fff",
            borderRadius: 9,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          How to start →
        </a>
      ) : (
        <p
          style={{
            marginTop: 18,
            padding: "11px 14px",
            border: "1px dashed #ddd",
            borderRadius: 9,
            fontSize: 13,
            color: "#999",
            textAlign: "center",
          }}
        >
          Contact the organization directly to begin.
        </p>
      )}
    </div>
  );
}
