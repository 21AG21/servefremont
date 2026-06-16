"use client";

import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import { verifiedSortKey } from "@/lib/freshness";

type Filters = {
  search: string;
  location: string;
  category: string;
  school: string;
  age: number | null;
  signsOnly: boolean;
  acceptingOnly: boolean;
  transitOnly: boolean;
  justShowUp: boolean;
  oneTime: boolean;
  groupOnly: boolean;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  location: "",
  category: "",
  school: "",
  age: null,
  signsOnly: false,
  acceptingOnly: false,
  transitOnly: false,
  justShowUp: false,
  oneTime: false,
  groupOnly: false,
};

const AGES = [13, 14, 15, 16, 17, 18];
const SCHOOLS = [
  "American",
  "Irvington",
  "Kennedy",
  "Mission San Jose",
  "Washington",
];

function distinct(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
}

// "Just show up" = drop-in schedule, or onboarding that doesn't need an app.
function isJustShowUp(o: Opportunity): boolean {
  const s = (o.scheduleType ?? "").toLowerCase();
  const ob = (o.onboarding ?? "").toLowerCase();
  return s.includes("drop") || ob.includes("show") || ob.includes("just");
}

function isOneTime(o: Opportunity): boolean {
  const s = (o.scheduleType ?? "").toLowerCase();
  return s.includes("event") || s.includes("one");
}

export default function OpportunityList({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const locations = useMemo(
    () => distinct(opportunities.map((o) => o.city)),
    [opportunities]
  );
  const categories = useMemo(
    () => distinct(opportunities.flatMap((o) => o.categories)),
    [opportunities]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return opportunities
      .filter((o) => {
        // Hide explicitly-closed opportunities by default (§3.3).
        if (o.accepting === "no" && !filters.acceptingOnly) return false;

        if (
          q &&
          !o.title.toLowerCase().includes(q) &&
          !(o.orgName ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
        if (filters.location && o.city !== filters.location) return false;
        if (filters.category && !o.categories.includes(filters.category))
          return false;
        if (filters.school && !o.walkableFrom.includes(filters.school))
          return false;
        if (filters.age != null && o.minAge != null && o.minAge > filters.age)
          return false;
        if (filters.signsOnly && !o.signsHourForms) return false;
        if (filters.acceptingOnly && o.accepting !== "yes") return false;
        if (filters.transitOnly && !o.transitNotes) return false;
        if (filters.justShowUp && !isJustShowUp(o)) return false;
        if (filters.oneTime && !isOneTime(o)) return false;
        if (filters.groupOnly && !o.groupFriendly) return false;
        return true;
      })
      // Default sort: most recently verified first (§3.3).
      .sort((a, b) => verifiedSortKey(b.verifiedAt) - verifiedSortKey(a.verifiedAt));
  }, [opportunities, filters]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const selectClass =
    "rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink";
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition ${
      active
        ? "border-brand bg-brand-soft text-brand-dark"
        : "border-ink/15 bg-white text-ink-soft hover:border-ink/30"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-3">
        <input
          type="search"
          inputMode="search"
          placeholder="Search by title or organization…"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={filters.location}
            onChange={(e) => update("location", e.target.value)}
            className={selectClass}
            aria-label="Location"
          >
            <option value="">📍 Any location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => update("category", e.target.value)}
            className={selectClass}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filters.school}
            onChange={(e) => update("school", e.target.value)}
            className={selectClass}
            aria-label="Near my school"
          >
            <option value="">Near my school</option>
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-ink-soft">I&apos;m</span>
          {AGES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => update("age", filters.age === a ? null : a)}
              className={chip(filters.age === a)}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update("signsOnly", !filters.signsOnly)}
            className={chip(filters.signsOnly)}
          >
            ✓ Signs hour forms
          </button>
          <button
            type="button"
            onClick={() => update("acceptingOnly", !filters.acceptingOnly)}
            className={chip(filters.acceptingOnly)}
          >
            Accepting now
          </button>
          <button
            type="button"
            onClick={() => update("justShowUp", !filters.justShowUp)}
            className={chip(filters.justShowUp)}
          >
            Just show up
          </button>
          <button
            type="button"
            onClick={() => update("oneTime", !filters.oneTime)}
            className={chip(filters.oneTime)}
          >
            One-time OK
          </button>
          <button
            type="button"
            onClick={() => update("groupOnly", !filters.groupOnly)}
            className={chip(filters.groupOnly)}
          >
            Groups / clubs
          </button>
          <button
            type="button"
            onClick={() => update("transitOnly", !filters.transitOnly)}
            className={chip(filters.transitOnly)}
          >
            Near transit
          </button>
          {isFiltered && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-auto rounded-full px-3 py-1.5 text-xs text-ink-soft underline hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-xs text-ink-soft">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 bg-white p-6 text-center text-sm text-ink-soft">
          No opportunities match these filters. Try removing one, or clear them
          all.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
