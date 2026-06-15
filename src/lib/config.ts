import { siteConfig } from "@config/site.config";
import { targetsConfig } from "@config/targets.config";

export { siteConfig, targetsConfig };

/** Canonical site URL, trailing-slash-stripped. Prefers env, falls back to the configured domain. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `https://${siteConfig.business.domain}`
).replace(/\/+$/, "");

/** GA4 Measurement ID resolved from config first, then env. */
export const GA4_ID =
  siteConfig.analytics.ga4MeasurementId ||
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
  "";

/** Analytics only loads when a GA4 id is present — keeps local dev clean. */
export const ANALYTICS_ENABLED = GA4_ID.length > 0;
