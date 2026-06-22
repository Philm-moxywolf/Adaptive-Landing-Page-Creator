/**
 * Shared types for the configuration surface. These describe the two files a
 * client edits — `config/site.config.ts` and `config/targets.config.ts` — and
 * give full editor autocomplete + type-safety so misconfiguration is caught at
 * build time rather than in production.
 */

export type ConversionGoal =
  | "lead"
  | "purchase"
  | "signup"
  | "call"
  | "demo"
  | "download";

/** A hex color string, e.g. "#4f46e5". Converted to RGB triplets at runtime. */
export type Hex = string;

export interface BrandColors {
  /** Primary brand color — main CTAs, links, emphasis. */
  brand: Hex;
  /** Readable text/icon color placed on top of `brand`. */
  brandFg: Hex;
  /** A softened brand tint for backgrounds and accents. */
  brandMuted: Hex;
  /** Secondary accent (badges, highlights, urgency). */
  accent: Hex;
  /** Text color on top of `accent`. */
  accentFg: Hex;
  /** Page background. */
  bg: Hex;
  /** Card / elevated surface background. */
  surface: Hex;
  /** Primary body text. */
  ink: Hex;
  /** Secondary / muted body text. */
  inkMuted: Hex;
  /** Hairline borders and dividers. */
  line: Hex;
  /** Positive / success (guarantees, checkmarks). */
  success: Hex;
}

export interface SiteConfig {
  business: {
    name: string;
    legalName?: string;
    /** Bare domain, no protocol, e.g. "acme.com". */
    domain: string;
    supportEmail?: string;
    phone?: string;
  };
  brand: {
    colors: BrandColors;
    /** Border radius applied across the UI, e.g. "0.75rem". */
    radius: string;
    fonts: {
      /** CSS font-family for body text. */
      sans: string;
      /** CSS font-family for headlines (falls back to `sans`). */
      display: string;
      /** Optional <link> hrefs to load the fonts (e.g. Google Fonts). */
      stylesheets?: string[];
    };
    logo: {
      /** URL/path to a logo image. If omitted, the wordmark text is used. */
      src?: string;
      /** Text wordmark fallback shown when no logo image is set. */
      wordmark: string;
    };
  };
  seo: {
    siteName: string;
    /** Used when a page provides no title. */
    defaultTitle: string;
    /** "%s" is replaced by the page title, e.g. "%s | Acme". */
    titleTemplate: string;
    defaultDescription: string;
    /** Absolute or root-relative URL to a 1200x630 share image. */
    defaultOgImage?: string;
    twitterHandle?: string;
    locale: string;
    /** ISO 4217 currency for Product/Offer structured data, e.g. "USD", "GBP". */
    currency: string;
    /** Google Search Console verification token (Settings → Ownership → HTML tag). */
    googleSiteVerification?: string;
    /**
     * How robots.txt treats AI crawlers (AIEO). Defaults to "allow":
     * - "allow": every AI crawler may read the page (maximizes AI-answer visibility).
     * - "search-only": allow AI SEARCH bots, block TRAINING-only bots.
     * - "block": block all known AI crawlers.
     */
    aiCrawlerPolicy?: "allow" | "search-only" | "block";
  };
  analytics: {
    /** GA4 Measurement ID. Falls back to NEXT_PUBLIC_GA4_MEASUREMENT_ID. */
    ga4MeasurementId?: string;
    /** Show a Consent Mode v2 banner and gate analytics on acceptance. */
    enableConsentBanner: boolean;
    /** Scroll-depth percentages that fire `scroll_depth` events. */
    scrollDepthThresholds: number[];
    /** Report Core Web Vitals (LCP/CLS/INP/...) to GA4. */
    reportWebVitals: boolean;
  };
  conversion: {
    primaryGoal: ConversionGoal;
    /** Booking link / checkout URL / app signup — the destination of primary CTAs. */
    primaryCtaHref: string;
    /** Forward /api/lead submissions to LEAD_WEBHOOK_URL when true. */
    leadWebhookEnabled: boolean;
    /** GA4 event name counted as the conversion (e.g. "generate_lead"). */
    conversionEventName: string;
  };
  experiment: {
    /** Master switch for A/B variant bucketing. */
    enabled: boolean;
    /** Variant keys. The optimizer writes per-variant content overrides. */
    variants: string[];
    /** Optional traffic split (must sum to 1). Defaults to even split. */
    weights?: number[];
  };
  social: {
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
  };
  organization: {
    /** schema.org type for structured data. */
    type: "Organization" | "LocalBusiness" | "ProfessionalService";
    /** Authoritative URLs about the org (socials, Crunchbase, etc.). */
    sameAs: string[];
  };
  /**
   * Free-text brief the WEEKLY OPTIMIZER reads to keep copy on-strategy. This is
   * where the client's ICP, offer, voice, and proof live. The richer this is, the
   * smarter every rewrite. See docs/CONTENT_GUIDE.md.
   */
  strategy: {
    /** One-line description of the offer. */
    offer: string;
    /** Who this is for + their #1 pain, in the client's words. */
    icp: string;
    /** Top objections the page must overcome. */
    objections: string[];
    /** Hard proof points the copy may cite (numbers, awards, named clients). */
    proof: string[];
    /** Brand voice / tone guardrails. */
    voice: string;
    /** Claims the optimizer must NEVER make (compliance, legal, unverifiable). */
    forbiddenClaims: string[];
  };
}

export type TargetUnit = "percent" | "count" | "usd" | "ratio" | "seconds";
export type TargetDirection = "higher_is_better" | "lower_is_better";

export interface ConversionTarget {
  /** Stable key, e.g. "primary_cvr". */
  key: string;
  label: string;
  /** The GA4-derived metric this maps to (computed in optimizer/ga4.ts `metrics`). */
  metric:
    | "conversion_rate"
    | "conversions"
    | "engagement_rate"
    | "bounce_rate"
    | "avg_session_duration"
    | "cta_click_rate"
    | "scroll_75_rate"
    | "form_completion_rate"
    | "organic_ctr"
    | "avg_position"
    | "ai_referral_share";
  unit: TargetUnit;
  direction: TargetDirection;
  /** The goal value. "Achieved" = this value scaled by the stretch multiplier. */
  target: number;
}

export interface TargetsConfig {
  /**
   * "120% of target". For higher-is-better metrics, success = current ≥ target × 1.2.
   * For lower-is-better metrics, success = current ≤ target ÷ 1.2.
   */
  stretchMultiplier: number;
  /** Rolling window the optimizer evaluates, in days. */
  evaluationWindowDays: number;
  targets: ConversionTarget[];
}
