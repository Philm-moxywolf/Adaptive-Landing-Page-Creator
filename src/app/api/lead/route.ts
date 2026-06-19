import { NextResponse } from "next/server";
import { siteConfig, GA4_ID } from "@/lib/config";

/**
 * Lead intake endpoint.
 *  1. Rate-limits, caps body size, enforces the honeypot SERVER-side, validates.
 *  2. Forwards only sanitized, length-capped fields to the client's webhook/CRM.
 *  3. Fires a server-side GA4 conversion via the Measurement Protocol — so the
 *     conversion is counted even when the browser tag is blocked.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELDS = 40;
const MAX_VALUE_LEN = 2000;
const MAX_KEY_LEN = 64;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Best-effort in-memory per-IP rate limiter. NOTE: serverless instances do NOT
// share memory, so this is per-instance only. For robust global limits, swap in
// Vercel KV / Upstash Ratelimit (see docs/SETUP.md).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : "").trim() || "unknown";
}

/** Keep only scalar fields, cap lengths/counts, and drop the honeypot. */
function sanitize(body: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, value] of Object.entries(body)) {
    if (key === "company_website") continue; // honeypot — never forward
    if (key.length > MAX_KEY_LEN || count >= MAX_FIELDS) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = String(value).slice(0, MAX_VALUE_LEN);
      count++;
    }
  }
  return out;
}

export async function POST(req: Request) {
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429 },
    );
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload too large." },
      { status: 413 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  // Server-side honeypot — the client check is trivially bypassed by a direct POST.
  if (body.company_website) {
    return NextResponse.json({ ok: true }); // look successful, do nothing
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required." },
      { status: 422 },
    );
  }

  const clean = sanitize(body);

  // 2. Forward only the sanitized fields to the client's webhook / CRM.
  if (siteConfig.conversion.leadWebhookEnabled && process.env.LEAD_WEBHOOK_URL) {
    try {
      await fetch(process.env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clean,
          source: "adaptive-landing-page",
          received_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Lead webhook failed:", err);
    }
  }

  // 3. Server-side GA4 conversion (Measurement Protocol).
  const apiSecret = process.env.GA4_MEASUREMENT_PROTOCOL_SECRET;
  const clientId = parseGaClientId(req.headers.get("cookie"));
  if (GA4_ID && apiSecret && clientId) {
    try {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${apiSecret}`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: clientId,
            events: [
              {
                name: siteConfig.conversion.conversionEventName,
                params: {
                  value: 1,
                  currency: siteConfig.seo.currency,
                  form_id: clean.form_id ?? "lead",
                  engagement_time_msec: 1,
                },
              },
            ],
          }),
        },
      );
    } catch (err) {
      console.error("GA4 Measurement Protocol failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

/** Extract the GA4 client id ("1234567890.0987654321") from the _ga cookie. */
function parseGaClientId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/_ga=GA\d\.\d\.(\d+\.\d+)/);
  return match ? match[1] : null;
}
