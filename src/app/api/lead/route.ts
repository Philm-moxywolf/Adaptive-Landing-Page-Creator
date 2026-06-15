import { NextResponse } from "next/server";
import { siteConfig, GA4_ID } from "@/lib/config";

/**
 * Lead intake endpoint.
 *  1. Validates a minimal payload.
 *  2. Forwards to the client's webhook/CRM (if configured).
 *  3. Fires a server-side GA4 conversion via the Measurement Protocol — so the
 *     conversion is counted even when the browser tag is blocked. This keeps the
 *     optimizer's conversion data accurate.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required." },
      { status: 422 },
    );
  }

  // 2. Forward to the client's webhook / CRM.
  if (siteConfig.conversion.leadWebhookEnabled && process.env.LEAD_WEBHOOK_URL) {
    try {
      await fetch(process.env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          source: "adaptive-landing-page",
          received_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Don't fail the visitor's submission on a downstream webhook hiccup.
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
                  currency: "USD",
                  form_id: body.form_id ?? "lead",
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
