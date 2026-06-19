import type { SiteConfig } from "@/lib/types";

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  THIS IS THE FILE YOU EDIT TO MAKE THE PAGE YOURS.                          │
 * │  Change the values below, drop your copy into content/landing.json, set     │
 * │  your env vars, and deploy. You should not need to touch anything in src/.  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * The values here are a worked EXAMPLE (a fictional B2B offer) so the page runs
 * out of the box. Replace every field with your own.
 */
export const siteConfig: SiteConfig = {
  business: {
    name: "Acme",
    legalName: "Acme Technologies Inc.",
    domain: "example.com",
    supportEmail: "hello@example.com",
    phone: "",
  },

  brand: {
    colors: {
      brand: "#4f46e5",
      brandFg: "#ffffff",
      brandMuted: "#eef2ff",
      accent: "#f59e0b",
      accentFg: "#1f1300",
      bg: "#ffffff",
      surface: "#f8fafc",
      ink: "#0f172a",
      inkMuted: "#475569",
      line: "#e2e8f0",
      success: "#16a34a",
    },
    radius: "0.875rem",
    fonts: {
      sans: "Inter",
      display: "Inter",
      stylesheets: [
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      ],
    },
    logo: {
      src: "",
      wordmark: "Acme",
    },
  },

  seo: {
    siteName: "Acme",
    defaultTitle: "Cut reporting time by 80% — without hiring an analyst",
    titleTemplate: "%s | Acme",
    defaultDescription:
      "Acme turns your scattered spreadsheets into board-ready dashboards in minutes. Start free, no credit card.",
    // Leave blank to use the auto-generated branded OG image (src/app/opengraph-image.tsx).
    // Set a path like "/og.png" (placed in /public) to use a bespoke card instead.
    defaultOgImage: "",
    twitterHandle: "@acme",
    locale: "en_US",
    currency: "USD", // ISO 4217 — used in Product/Offer structured data
  },

  analytics: {
    // Leave blank to use the NEXT_PUBLIC_GA4_MEASUREMENT_ID env var instead.
    ga4MeasurementId: "",
    enableConsentBanner: true,
    scrollDepthThresholds: [25, 50, 75, 90],
    reportWebVitals: true,
  },

  conversion: {
    primaryGoal: "demo",
    primaryCtaHref: "#lead",
    leadWebhookEnabled: true,
    conversionEventName: "generate_lead",
  },

  experiment: {
    enabled: true,
    variants: ["A", "B"],
    // weights: [0.5, 0.5], // optional; defaults to even
  },

  social: {
    twitter: "https://twitter.com/acme",
    linkedin: "https://linkedin.com/company/acme",
  },

  organization: {
    type: "Organization",
    sameAs: [
      "https://twitter.com/acme",
      "https://linkedin.com/company/acme",
    ],
  },

  strategy: {
    offer:
      "A self-serve analytics tool that turns spreadsheets into board-ready dashboards in minutes, starting free.",
    icp:
      "Operations and finance leads at 20–200 person companies who live in spreadsheets, dread monthly reporting, and can't justify hiring a full-time analyst.",
    objections: [
      "We already have spreadsheets / a BI tool we barely use.",
      "Setup will take weeks and I don't have time.",
      "My data is messy and lives in too many places.",
      "It'll be too expensive once we scale.",
    ],
    proof: [
      "Used by 4,000+ teams",
      "Average setup time under 11 minutes",
      "Rated 4.8/5 across 600+ reviews",
    ],
    voice:
      "Confident, concrete, and warm. Short sentences. Speak to the pain, quantify the payoff, never hype. No exclamation marks in body copy.",
    forbiddenClaims: [
      "Any guarantee of specific revenue or ROI figures.",
      "Claims of being the #1 / best tool without a cited source.",
      "Any mention of compliance certifications we do not hold.",
    ],
  },
};

export default siteConfig;
