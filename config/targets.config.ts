import type { TargetsConfig } from "@/lib/types";

/**
 * Conversion targets — this is where "achieve 120% of all metrics" is made concrete.
 *
 * A conversion RATE can't exceed 100% in absolute terms, so "120%" is defined as
 * 120% OF EACH TARGET VALUE you set below (i.e. beat the goal by 20%). The weekly
 * optimizer measures each metric over `evaluationWindowDays`, reports attainment,
 * and keeps rewriting the page until every metric clears its stretch goal. Once a
 * goal is consistently beaten, raise the `target` here to ratchet performance up.
 *
 * Set targets from your own baseline + ambition. The numbers below are illustrative.
 */
export const targetsConfig: TargetsConfig = {
  stretchMultiplier: 1.2, // "120% of target"
  evaluationWindowDays: 7,

  targets: [
    {
      key: "primary_cvr",
      label: "Primary conversion rate (sessions → lead)",
      metric: "conversion_rate",
      unit: "percent",
      direction: "higher_is_better",
      target: 4.0,
    },
    {
      key: "cta_ctr",
      label: "Hero/primary CTA click-through rate",
      metric: "cta_click_rate",
      unit: "percent",
      direction: "higher_is_better",
      target: 12.0,
    },
    {
      key: "scroll_75",
      label: "Share of sessions reaching 75% scroll depth",
      metric: "scroll_75_rate",
      unit: "percent",
      direction: "higher_is_better",
      target: 45.0,
    },
    {
      key: "form_completion",
      label: "Lead form completion rate (start → submit)",
      metric: "form_completion_rate",
      unit: "percent",
      direction: "higher_is_better",
      target: 60.0,
    },
    {
      key: "engagement_rate",
      label: "GA4 engagement rate",
      metric: "engagement_rate",
      unit: "percent",
      direction: "higher_is_better",
      target: 65.0,
    },
    {
      key: "bounce_rate",
      label: "Bounce rate",
      metric: "bounce_rate",
      unit: "percent",
      direction: "lower_is_better",
      target: 35.0,
    },
    // SEO (Google Search Console) — only scored when GSC is connected.
    {
      key: "organic_ctr",
      label: "Organic search CTR (Search Console)",
      metric: "organic_ctr",
      unit: "percent",
      direction: "higher_is_better",
      target: 3.0,
    },
    {
      key: "avg_position",
      label: "Average search position (Search Console)",
      metric: "avg_position",
      unit: "ratio",
      direction: "lower_is_better",
      target: 10.0,
    },
    // AIEO — only scored when AI-referral events are present.
    {
      key: "ai_referral_share",
      label: "AI-referred sessions share (ChatGPT/Perplexity/Gemini/…)",
      metric: "ai_referral_share",
      unit: "percent",
      direction: "higher_is_better",
      target: 3.0,
    },
  ],
};

export default targetsConfig;
