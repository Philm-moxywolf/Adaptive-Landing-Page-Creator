import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Pulls the last N days of GA4 data the optimizer needs to diagnose the funnel.
 * Designed to degrade gracefully: if credentials or a property id are missing
 * (e.g. a brand-new deployment with no traffic yet), it returns `null` and the
 * optimizer proceeds in cold-start mode on research + CRO heuristics alone.
 */

export interface Ga4Report {
  windowDays: number;
  startDate: string;
  endDate: string;
  sessions: number;
  conversions: number;
  /** Values keyed by the metric keys used in config/targets.config.ts. */
  metrics: Record<string, number | null>;
  /** eventCount keyed by event name. */
  events: Record<string, number>;
  channels: { channel: string; sessions: number; conversions: number }[];
  variants: { variant: string; sessions: number; conversions: number; cvr: number }[];
  notes: string[];
}

const TRACKED_EVENTS = [
  "cta_click",
  "scroll_depth",
  "form_start",
  "form_submit",
  "generate_lead",
  "section_view",
];

function num(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildClient(): BetaAnalyticsDataClient | null {
  const inline = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      const creds = JSON.parse(inline);
      return new BetaAnalyticsDataClient({
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
        projectId: creds.project_id,
      });
    } catch {
      console.warn("GA4_SERVICE_ACCOUNT_JSON is not valid JSON — ignoring.");
    }
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS (path) picked up automatically.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new BetaAnalyticsDataClient();
  }
  return null;
}

export async function fetchGa4Report(
  windowDays: number,
): Promise<Ga4Report | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const client = buildClient();
  if (!propertyId || !client) {
    console.warn(
      "GA4 not configured (need GA4_PROPERTY_ID + service-account creds) — cold-start mode.",
    );
    return null;
  }

  const property = `properties/${propertyId}`;
  const startDate = `${windowDays}daysAgo`;
  const endDate = "yesterday";
  const notes: string[] = [];

  // 1. Totals.
  const [totals] = await client.runReport({
    property,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "sessions" },
      { name: "conversions" },
      { name: "engagementRate" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
  });
  const t = totals.rows?.[0]?.metricValues ?? [];
  const sessions = num(t[0]?.value);
  const conversions = num(t[1]?.value);
  const engagementRate = num(t[2]?.value) * 100;
  const bounceRate = num(t[3]?.value) * 100;
  const avgEngagementTime = num(t[4]?.value);

  // 2. Event counts by name.
  const events: Record<string, number> = {};
  try {
    const [evt] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      limit: 100,
    });
    for (const row of evt.rows ?? []) {
      const name = row.dimensionValues?.[0]?.value ?? "";
      if (TRACKED_EVENTS.includes(name)) {
        events[name] = num(row.metricValues?.[0]?.value);
      }
    }
  } catch {
    notes.push("Could not read event breakdown.");
  }

  // 3. Channel (source / medium) breakdown.
  const channels: Ga4Report["channels"] = [];
  try {
    const [ch] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "conversions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 12,
    });
    for (const row of ch.rows ?? []) {
      channels.push({
        channel: row.dimensionValues?.[0]?.value ?? "(unknown)",
        sessions: num(row.metricValues?.[0]?.value),
        conversions: num(row.metricValues?.[1]?.value),
      });
    }
  } catch {
    notes.push("Could not read channel breakdown.");
  }

  // 4. Variant breakdown (requires a registered `variant` custom dimension).
  const variants: Ga4Report["variants"] = [];
  try {
    const [vr] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "customEvent:variant" }],
      metrics: [{ name: "sessions" }, { name: "conversions" }],
      limit: 10,
    });
    for (const row of vr.rows ?? []) {
      const v = row.dimensionValues?.[0]?.value ?? "(not set)";
      const s = num(row.metricValues?.[0]?.value);
      const c = num(row.metricValues?.[1]?.value);
      variants.push({ variant: v, sessions: s, conversions: c, cvr: s ? (c / s) * 100 : 0 });
    }
  } catch {
    notes.push(
      "No `variant` custom dimension registered in GA4 — per-variant conversion not available. Register it to enable A/B analysis.",
    );
  }

  // 5. Scroll-75 rate (requires a registered `percent` custom dimension).
  let scroll75Rate: number | null = null;
  try {
    const [sc] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "customEvent:percent" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: "scroll_depth" },
        },
      },
      limit: 20,
    });
    let deep = 0;
    for (const row of sc.rows ?? []) {
      const pct = num(row.dimensionValues?.[0]?.value);
      if (pct >= 75) deep += num(row.metricValues?.[0]?.value);
    }
    scroll75Rate = sessions ? (deep / sessions) * 100 : null;
  } catch {
    notes.push("No `percent` custom dimension — scroll-75 rate unavailable.");
  }

  const metrics: Record<string, number | null> = {
    conversion_rate: sessions ? (conversions / sessions) * 100 : null,
    conversions,
    engagement_rate: engagementRate,
    bounce_rate: bounceRate,
    avg_engagement_time: avgEngagementTime,
    cta_click_rate: sessions ? ((events["cta_click"] ?? 0) / sessions) * 100 : null,
    scroll_75_rate: scroll75Rate,
    form_completion_rate: events["form_start"]
      ? ((events["form_submit"] ?? 0) / events["form_start"]) * 100
      : null,
  };

  return {
    windowDays,
    startDate,
    endDate,
    sessions,
    conversions,
    metrics,
    events,
    channels,
    variants,
    notes,
  };
}
