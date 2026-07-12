// Server-side loader for the homepage: all active listings from Airtable,
// joined to their organization. The Airtable token stays server-side — the
// page fetches here at render time and ships plain data to the client.

import type { Listing } from "@/lib/listing";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

type AirtableRec = { id: string; fields: Record<string, unknown> };
type ListResponse = { records: AirtableRec[] };

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function isYes(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "string") return v.toLowerCase() === "yes";
  return false;
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}
// Airtable returns multipleSelects as either string[] or [{name}].
function selectNames(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .map((x) => (typeof x === "string" ? x : (x as { name?: string })?.name))
    .filter((x): x is string => typeof x === "string" && x.length > 0);
}
// Multilinetext → array of non-empty trimmed lines.
function lines(v: unknown): string[] {
  if (typeof v !== "string") return [];
  return v
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[-•*\d]+[.)]?\s*/, "").trim())
    .filter(Boolean);
}
function formatMonthYear(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

async function fetchTable(
  table: string,
  token: string,
  baseId: string
): Promise<AirtableRec[]> {
  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${table}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Airtable "${table}" failed: ${res.status}`);
  }
  const data: ListResponse = await res.json();
  return data.records;
}

/** Throws if the server is missing Airtable credentials or Airtable errors. */
export async function getListings(): Promise<Listing[]> {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    throw new Error("Server is not configured for Airtable.");
  }

  const [opps, orgs] = await Promise.all([
    fetchTable("Opportunities", token, baseId),
    fetchTable("Organizations", token, baseId),
  ]);

  const orgsById = new Map(orgs.map((o) => [o.id, o.fields]));

  return opps
    .filter((rec) => {
      const status = str(rec.fields.Status);
      return !status || status.toLowerCase() === "active";
    })
    .map((rec) => {
      const f = rec.fields;
      const orgLink = arr(f.Organization)[0];
      const org = orgLink ? orgsById.get(orgLink) : undefined;
      const signs = str(f.Signs_Hour_Forms)?.toLowerCase();

      return {
        id: rec.id,
        title: str(f.Title) ?? "(untitled)",
        org: (org && str(org.Name)) ?? "",
        category: selectNames(f.Category).length
          ? selectNames(f.Category)
          : org
            ? selectNames(org.Categories)
            : [],
        ageMin: num(f.AgeMin) ?? num(f.Min_Age),
        ageMax: num(f.Max_Age),
        shiftLengthHours: num(f.Shift_Length_Hours),
        scheduleNotes: str(f.Schedule_Notes),
        nextSession: str(f.Next_Session),
        lat: num(f.Lat) ?? (org ? num(org.Lat) ?? num(org.Latitude) : undefined),
        lng: num(f.Lng) ?? (org ? num(org.Lng) ?? num(org.Longitude) : undefined),
        verified:
          formatMonthYear(str(f.VerifiedDate)) ??
          formatMonthYear(str(f.Verified_At)),
        distance: str(f.Distance),
        accepting: isYes(f.Accepting),
        schedule: str(f.Schedule) ?? str(f.Schedule_Type),
        // "Yes" and "Own Letter" both effectively get the volunteer credit.
        // Anything else that isn't an explicit "No" is unconfirmed, not a no.
        signsHourForms:
          signs === "yes" || signs === "own letter"
            ? true
            : signs === "no"
              ? false
              : null,
        nearTransit: !!str(f.Transit_Notes) || isYes(f.Near_Transit),
        groupsOK: isYes(f.Group_Friendly) || isYes(f.Groups_OK),
        priority: f.Priority === true,
        walkableFrom: selectNames(f.Near_School),
        description: str(f.Description),
        onboarding: selectNames(f.Onboarding).join(", ") || undefined,
        onboardingTime: str(f.Onboarding_Time),
        howToStartSteps: lines(f.How_To_Start_Steps),
        howToStartUrl: str(f.How_To_Start_UTL) ?? str(f.How_To_Start_Url),
        transitNotes: str(f.Transit_Notes),
        address: org ? str(org.Address) : undefined,
        website: org ? str(org.Website) : undefined,
      };
    });
}
