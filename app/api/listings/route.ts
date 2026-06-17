// Returns all listings from Airtable, joined to their organization. The
// Airtable token stays server-side; the browser only ever sees this endpoint.

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

export async function GET() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    return Response.json(
      { error: "Server is not configured for Airtable." },
      { status: 500 }
    );
  }

  try {
    const [opps, orgs] = await Promise.all([
      fetchTable("Opportunities", token, baseId),
      fetchTable("Organizations", token, baseId),
    ]);

    const orgsById = new Map(orgs.map((o) => [o.id, o.fields]));

    const listings: Listing[] = opps.map((rec) => {
      const f = rec.fields;
      const orgLink = arr(f.Organization)[0];
      const org = orgLink ? orgsById.get(orgLink) : undefined;

      return {
        id: rec.id,
        title: str(f.Title) ?? "(untitled)",
        org: (org && str(org.Name)) ?? "",
        // Category lives on the org; also accept a Category field on the opp.
        category: arr(f.Category).length
          ? arr(f.Category)
          : org
            ? arr(org.Categories)
            : [],
        ageMin: num(f.AgeMin) ?? num(f.Min_Age),
        lat: num(f.Lat) ?? (org ? num(org.Lat) ?? num(org.Latitude) : undefined),
        lng: num(f.Lng) ?? (org ? num(org.Lng) ?? num(org.Longitude) : undefined),
        verified:
          formatMonthYear(str(f.VerifiedDate)) ??
          formatMonthYear(str(f.Verified_At)),
        distance: str(f.Distance),
        accepting: isYes(f.Accepting),
        schedule: str(f.Schedule) ?? str(f.Schedule_Type),
        signsHourForms: isYes(f.Signs_Hour_Forms),
        nearTransit: !!str(f.Transit_Notes) || isYes(f.Near_Transit),
        groupsOK: isYes(f.Group_Friendly) || isYes(f.Groups_OK),
        description: str(f.Description),
        onboarding: str(f.Onboarding),
        onboardingTime: str(f.Onboarding_Time),
        howToStartUrl: str(f.How_To_Start_UTL) ?? str(f.How_To_Start_Url),
        transitNotes: str(f.Transit_Notes),
        address: org ? str(org.Address) : undefined,
        website: org ? str(org.Website) : undefined,
      };
    });

    return Response.json({ listings });
  } catch {
    return Response.json(
      { error: "Could not load listings from Airtable." },
      { status: 502 }
    );
  }
}
