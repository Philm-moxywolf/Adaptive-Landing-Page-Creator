import { GoogleAuth } from "google-auth-library";

/**
 * Pulls last-N-days Google Search Console data (the best FREE SEO signal) so the
 * weekly optimizer can fix findability, not just on-page conversion: high-impression
 * low-CTR queries → rewrite the title/meta/H1; page-2 keywords → strengthen copy.
 *
 * Reuses the SAME service-account credentials as the GA4 reader — the recipient just
 * adds that service-account email as a user on their Search Console property. Set
 * GSC_SITE_URL to the property (e.g. "sc-domain:acme.com" or "https://acme.com/").
 * Degrades to `null` when unconfigured, like optimizer/ga4.ts.
 */

export interface GscRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscReport {
  windowDays: number;
  startDate: string;
  endDate: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  topQueries: GscRow[];
  lowCtrQueries: GscRow[];
  page2Queries: GscRow[];
  metrics: Record<string, number | null>;
  notes: string[];
}

function buildAuth(): GoogleAuth | null {
  const scopes = ["https://www.googleapis.com/auth/webmasters.readonly"];
  const inline = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      const creds = JSON.parse(inline);
      return new GoogleAuth({
        credentials: { client_email: creds.client_email, private_key: creds.private_key },
        scopes,
      });
    } catch {
      return null;
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return new GoogleAuth({ scopes });
  return null;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

interface GscApiResponse {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
}

export async function fetchGscReport(windowDays: number): Promise<GscReport | null> {
  const site = process.env.GSC_SITE_URL;
  const auth = buildAuth();
  if (!site || !auth) return null;

  // GSC data lags ~2-3 days; clamp so recent partial days don't skew CTR/position.
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  // GSC date ranges are inclusive on both ends, so subtract windowDays-1 to span
  // exactly `windowDays` days (matching the GA4 window the targets assume).
  start.setUTCDate(start.getUTCDate() - windowDays + 1);
  const startDate = ymd(start);
  const endDate = ymd(end);

  const empty: GscReport = {
    windowDays, startDate, endDate,
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topQueries: [], lowCtrQueries: [], page2Queries: [], metrics: {}, notes: [],
  };

  try {
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) return { ...empty, notes: ["GSC auth produced no token"] };

    const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
    const query = async (body: object): Promise<GscApiResponse> => {
      const res = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`GSC HTTP ${res.status}`);
      return (await res.json()) as GscApiResponse;
    };

    // aggregationType "byProperty" keeps totals deterministic across property types
    // (URL-prefix properties otherwise default to per-page aggregation).
    const totalsResp = await query({ startDate, endDate, aggregationType: "byProperty" });
    const t = totalsResp.rows?.[0];
    const totals = {
      clicks: Number(t?.clicks ?? 0),
      impressions: Number(t?.impressions ?? 0),
      ctr: Number(t?.ctr ?? 0),
      position: Number(t?.position ?? 0),
    };

    const queriesResp = await query({
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 50,
      aggregationType: "byProperty",
    });
    const rows: GscRow[] = (queriesResp.rows ?? []).map((r) => ({
      query: String(r.keys?.[0] ?? ""),
      clicks: Number(r.clicks ?? 0),
      impressions: Number(r.impressions ?? 0),
      ctr: Number(r.ctr ?? 0),
      position: Number(r.position ?? 0),
    }));

    const byImpressions = (a: GscRow, b: GscRow) => b.impressions - a.impressions;
    return {
      windowDays, startDate, endDate, totals,
      topQueries: [...rows].sort(byImpressions).slice(0, 15),
      // High impressions but poor CTR — the clearest "rewrite the title/meta" signal.
      lowCtrQueries: rows.filter((r) => r.impressions >= 20 && r.ctr < 0.02).sort(byImpressions).slice(0, 8),
      // Ranking page 2 (pos 11-20) with demand — strengthen the copy for these.
      page2Queries: rows.filter((r) => r.position > 10 && r.position <= 20 && r.impressions >= 10).sort(byImpressions).slice(0, 8),
      metrics: {
        organic_ctr: totals.impressions ? totals.ctr * 100 : null,
        avg_position: totals.impressions ? totals.position : null,
      },
      notes: [],
    };
  } catch (err) {
    return { ...empty, notes: [`GSC error: ${(err as Error).message}`] };
  }
}
