import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Per-IP request cap so one visitor reloading in a loop (or a bot) can't
// burn through the free-tier Vercel function quota for everyone else. See
// docs/abuse-protection-plan.md — this is layer 2 (defense-in-depth);
// layer 1 is the ISR revalidate on / and the dynamic [id] routes, which
// means most repeat traffic never reaches this code at all.
//
// In-memory, per-instance — resets on cold start / redeploy. That's fine:
// the goal is capping a single actor's burst, not perfect global counting.
const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 60;
const MAX_TRACKED_IPS = 5000;

const hits = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number) {
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function proxy(request: NextRequest) {
  const now = Date.now();
  if (hits.size > MAX_TRACKED_IPS) pruneExpired(now);

  const ip = clientIp(request);
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count++;
  if (entry.count > LIMIT_PER_WINDOW) {
    return new NextResponse("Too many requests — please slow down.", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Only the routes that actually cost a function invocation. Static pages
  // (/about, /for-organizations) and _next/static assets are never matched,
  // so they're untouched by this at all.
  matcher: ["/", "/opportunities/:path*", "/orgs/:path*", "/api/:path*"],
};
