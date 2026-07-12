// "Report outdated info" endpoint (spec §3.3 #7). Writes to the "Reports"
// table with status "pending" — a moderation queue with a 48-hour fix
// policy, same pattern as /api/submit. Values are stored as plain text and
// never rendered as HTML (T-6). Rate-limited per-IP via proxy.ts.

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

type ReportBody = {
  oppId?: string;
  oppTitle?: string;
  message?: string;
  email?: string;
  company?: string; // honeypot — real users never fill this
};

const cap = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: ReportBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: silently accept bots so they don't retry, but store nothing.
  if (body.company && body.company.trim().length > 0) {
    return Response.json({ ok: true });
  }

  const message = cap(body.message, 2000);
  if (!message) {
    return Response.json(
      { error: "Please describe what's outdated." },
      { status: 400 }
    );
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    return Response.json(
      { error: "Server is not configured to accept reports yet." },
      { status: 500 }
    );
  }

  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/Reports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        Opportunity_Title: cap(body.oppTitle, 200),
        Opportunity_Id: cap(body.oppId, 30),
        Message: message,
        Contact_Email: cap(body.email, 200),
        Status: "pending",
        Reported_At: new Date().toISOString().slice(0, 10),
      },
    }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Could not save your report right now — please try again later." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
