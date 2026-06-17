// Server-only data layer for talking to Airtable.
// The token is read from process.env and never reaches the browser.

import type { Opportunity, Organization } from "@/lib/types";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

// Shape of a raw Airtable record. Fields are whatever columns have values.
type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

function getCredentials() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    throw new Error(
      "Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID. Check your .env.local file."
    );
  }
  return { token, baseId };
}

// Fetch one table from Airtable. Cached 60s to stay under free-tier limits.
// TODO (later sprint): follow `response.offset` to paginate past 100 records.
async function fetchTable(table: string): Promise<AirtableRecord[]> {
  const { token, baseId } = getCredentials();
  const url = `${AIRTABLE_API_BASE}/${baseId}/${table}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `Airtable request for "${table}" failed: ${response.status} ${response.statusText}`
    );
  }

  const data: AirtableListResponse = await response.json();
  return data.records;
}

// --- small field helpers (Airtable values are loosely typed) ---

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

// Airtable single-select / checkbox values commonly come back as "Yes"/"No"
// or true/false. Treat anything that isn't clearly "yes/true" as not signed.
function isYes(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") return value.toLowerCase() === "yes";
  return false;
}

function parseAccepting(value: unknown): Opportunity["accepting"] {
  if (value === true) return "yes";
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "yes") return "yes";
    if (v === "no") return "no";
    if (v.includes("wait")) return "waitlist";
  }
  return "unknown";
}

function isActive(record: AirtableRecord): boolean {
  const status = str(record.fields.Status);
  return status?.toLowerCase() === "active";
}

// Pull the city out of a free-text address like "37350 Joseph St, Fremont"
// or "123 Main St, Fremont, CA 94538" -> "Fremont".
function cityFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  // Drop a trailing "CA 94538" / zip segment if present.
  const last = parts[parts.length - 1];
  if (last && /\d/.test(last) && parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return last;
}

// --- mappers from raw records to public types ---

function toOrganization(record: AirtableRecord): Organization {
  const f = record.fields;
  const address = str(f.Address);
  return {
    id: record.id,
    name: str(f.Name) ?? "(unnamed)",
    mission: str(f.Mission),
    address,
    city: cityFromAddress(address),
    lat: num(f.Lat) ?? num(f.Latitude),
    lng: num(f.Lng) ?? num(f.Longitude),
    website: str(f.Website),
    orgType: str(f.Org_Type),
    categories: Array.isArray(f.Categories) ? (f.Categories as string[]) : [],
  };
}

function toOpportunity(
  record: AirtableRecord,
  orgsById: Map<string, Organization>
): Opportunity {
  const f = record.fields;
  const orgLink = Array.isArray(f.Organization)
    ? (f.Organization as string[])[0]
    : undefined;
  const org = orgLink ? orgsById.get(orgLink) : undefined;

  return {
    id: record.id,
    title: str(f.Title) ?? "(untitled)",
    orgId: orgLink,
    orgName: org?.name,
    city: org?.city,
    lat: org?.lat,
    lng: org?.lng,
    categories: org?.categories ?? [],
    minAge: num(f.Min_Age),
    guardianRequiredUnder: num(f.Guardian_Required_Under),
    adultsOnly: isYes(f.Adults_Only),
    signsHourForms: isYes(f.Signs_Hour_Forms),
    accepting: parseAccepting(f.Accepting),
    scheduleType: str(f.Schedule_Type),
    scheduleNotes: str(f.Schedule_Notes),
    description: str(f.Description),
    transitNotes: str(f.Transit_Notes),
    nearSchool: isYes(f.Near_School),
    walkableFrom: Array.isArray(f.Walkable_From)
      ? (f.Walkable_From as string[])
      : [],
    groupFriendly: isYes(f.Group_Friendly),
    onboarding: (Array.isArray(f.Onboarding)
      ? (f.Onboarding as Array<string | { name?: string }>)
          .map((x) => (typeof x === "string" ? x : x?.name ?? ""))
          .filter(Boolean)
          .join(", ")
      : str(f.Onboarding)),
    onboardingTime: str(f.Onboarding_Time),
    costNotes: str(f.Cost_Notes),
    howToStartUrl: str(f.How_To_Start_UTL) ?? str(f.How_To_Start_Url),
    verifiedAt: str(f.Verified_At),
  };
}

// --- public API ---

/** All active organizations, keyed by id (used to join opportunities). */
async function getOrganizationsById(): Promise<Map<string, Organization>> {
  const records = await fetchTable("Organizations");
  const map = new Map<string, Organization>();
  for (const record of records) {
    map.set(record.id, toOrganization(record));
  }
  return map;
}

/** All active opportunities, each joined to its organization. */
export async function getOpportunities(): Promise<Opportunity[]> {
  const [oppRecords, orgsById] = await Promise.all([
    fetchTable("Opportunities"),
    getOrganizationsById(),
  ]);

  return oppRecords
    .filter(isActive)
    .map((record) => toOpportunity(record, orgsById));
}

/** A single active opportunity by id, or null if not found. */
export async function getOpportunity(
  id: string
): Promise<Opportunity | null> {
  const all = await getOpportunities();
  return all.find((o) => o.id === id) ?? null;
}

/** All active organizations as a list. */
export async function getOrganizations(): Promise<Organization[]> {
  const records = await fetchTable("Organizations");
  return records.filter(isActive).map(toOrganization);
}

/** A single active organization by id, or null if not found. */
export async function getOrganization(
  id: string
): Promise<Organization | null> {
  const record = (await fetchTable("Organizations")).find((r) => r.id === id);
  if (!record || !isActive(record)) return null;
  return toOrganization(record);
}
