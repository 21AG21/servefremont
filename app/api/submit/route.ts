// Self-submit endpoint for organizations. Writes to a separate "Submissions"
// table with status "pending" — nothing auto-publishes (spec §3.3 #6, T-5).
// All values are stored as plain text; we never render submitted HTML (T-6).

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

type SubmitBody = {
  orgName?: string;
  contactName?: string;
  email?: string;
  role?: string;
  website?: string;
  notes?: string;
  company?: string; // honeypot — real users never fill this
};

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: silently accept bots so they don't retry, but store nothing.
  if (body.company && body.company.trim().length > 0) {
    return Response.json({ ok: true });
  }

  const orgName = (body.orgName ?? "").trim();
  const email = (body.email ?? "").trim();
  if (!orgName || !email) {
    return Response.json(
      { error: "Organization name and email are required." },
      { status: 400 }
    );
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    return Response.json(
      { error: "Server is not configured to accept submissions yet." },
      { status: 500 }
    );
  }

  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/Submissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Org_Name: orgName,
        Contact_Name: (body.contactName ?? "").trim(),
        Email: email,
        Role: (body.role ?? "").trim(),
        Website: (body.website ?? "").trim(),
        Notes: (body.notes ?? "").trim(),
        Status: "pending",
        Submitted_At: new Date().toISOString().slice(0, 10),
      },
    }),
  });

  if (!res.ok) {
    // Most likely: the "Submissions" table doesn't exist yet, or the token
    // lacks data.records:write. Surface a clear message instead of a 500 page.
    return Response.json(
      {
        error:
          "Could not save your submission right now. Please email us instead.",
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
