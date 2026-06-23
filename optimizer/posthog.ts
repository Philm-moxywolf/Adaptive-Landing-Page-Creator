/**
 * Pulls last-N-days behavioural data from the recipient's OWN PostHog project via
 * the HogQL Query API, to corroborate GA4 and surface friction GA4 can't (the
 * weekly cron reads counts; session replay / heatmaps are for the human reviewer).
 *
 * Degrades to `null` when unconfigured — same pattern as optimizer/ga4.ts — so the
 * optimizer simply skips this signal if the recipient hasn't connected PostHog.
 *
 * Note the host split: ingestion is `<region>.i.posthog.com` (the page proxy), but
 * the Query API is the APP host `<region>.posthog.com` (no `.i`). Set POSTHOG_HOST
 * accordingly (defaults to https://us.posthog.com).
 */

export interface PosthogReport {
  windowDays: number;
  /** event name -> count over the window. */
  events: Record<string, number>;
  notes: string[];
}

export async function fetchPosthogReport(
  windowDays: number,
): Promise<PosthogReport | null> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!projectId || !apiKey) {
    return null; // PostHog not connected — skip this signal.
  }

  const host = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/+$/, "");
  const query = `SELECT event, count() AS c FROM events WHERE timestamp > now() - INTERVAL ${Number(windowDays)} DAY GROUP BY event ORDER BY c DESC LIMIT 50`;

  try {
    const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!res.ok) {
      return { windowDays, events: {}, notes: [`PostHog query failed: HTTP ${res.status}`] };
    }
    const data = (await res.json()) as { results?: unknown[] };
    const events: Record<string, number> = {};
    for (const row of data.results ?? []) {
      if (Array.isArray(row) && row.length >= 2) {
        events[String(row[0])] = Number(row[1]) || 0;
      }
    }
    return { windowDays, events, notes: [] };
  } catch (err) {
    return { windowDays, events: {}, notes: [`PostHog error: ${(err as Error).message}`] };
  }
}
