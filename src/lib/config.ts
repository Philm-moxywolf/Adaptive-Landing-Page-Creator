import { siteConfig } from "@config/site.config";
import { targetsConfig } from "@config/targets.config";

export { siteConfig, targetsConfig };

/** Canonical site URL, trailing-slash-stripped. Prefers env, falls back to the configured domain. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `https://${siteConfig.business.domain}`
).replace(/\/+$/, "");

// Fail loud on a real production deploy (Vercel) if the placeholder domain was
// never replaced — otherwise canonical URLs, sitemap, OG, and JSON-LD would all
// silently point at example.com. Local/preview builds with the example are fine.
if (process.env.VERCEL_ENV === "production") {
  let host = "";
  try {
    host = new URL(SITE_URL).hostname;
  } catch {
    throw new Error(`Invalid SITE_URL: "${SITE_URL}". Set NEXT_PUBLIC_SITE_URL.`);
  }
  if (/(^|\.)example\.com$/i.test(host)) {
    throw new Error(
      "SITE_URL resolves to the placeholder 'example.com' in production. " +
        "Set NEXT_PUBLIC_SITE_URL (or business.domain in config/site.config.ts) to your real domain.",
    );
  }
}

/** GA4 Measurement ID resolved from config first, then env. */
export const GA4_ID =
  siteConfig.analytics.ga4MeasurementId ||
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
  "";

/** Analytics only loads when a GA4 id is present — keeps local dev clean. */
export const ANALYTICS_ENABLED = GA4_ID.length > 0;

/** PostHog (client) project key — each recipient uses their own. Public-safe (phc_…). */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
/** PostHog UI host (for links in the SDK); ingestion is proxied via /r7x. */
export const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";
/** PostHog loads only when a project key is present. */
export const POSTHOG_ENABLED = POSTHOG_KEY.length > 0;
