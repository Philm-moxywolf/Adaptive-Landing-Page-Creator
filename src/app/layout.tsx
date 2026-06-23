import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import "./globals.css";
import {
  siteConfig,
  GA4_ID,
  ANALYTICS_ENABLED,
  SITE_URL,
  POSTHOG_ENABLED,
  POSTHOG_KEY,
  POSTHOG_UI_HOST,
} from "@/lib/config";
import { buildThemeCss } from "@/lib/theme";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { WebVitalsReporter } from "@/components/tracking/WebVitalsReporter";
import { ScrollDepthTracker } from "@/components/tracking/ScrollDepthTracker";
import { AiSourceTracker } from "@/components/tracking/AiSourceTracker";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const lang = siteConfig.seo.locale.split(/[_-]/)[0] || "en";

// Setting metadataBase at the root puts it in scope for the file-convention
// OG/Twitter image routes too (and silences the localhost metadataBase warning).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const themeCss = buildThemeCss(siteConfig);
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // Resolve consent server-side so returning visitors who already accepted are
  // not reset to "denied" for the first paint (Consent Mode v2 default).
  let initialConsent: "granted" | "denied" = "granted";
  if (siteConfig.analytics.enableConsentBanner) {
    const consentCookie = (await cookies()).get("lp_consent")?.value;
    initialConsent = consentCookie === "granted" ? "granted" : "denied";
  }

  const hasFonts = (siteConfig.brand.fonts.stylesheets?.length ?? 0) > 0;

  // Shared trackers + consent route through track() into BOTH GA and PostHog, so
  // they're active whenever EITHER source is on (a PostHog-only recipient still
  // gets the funnel + ai_referral events the optimizer reads).
  const trackingEnabled = ANALYTICS_ENABLED || POSTHOG_ENABLED;

  return (
    <html lang={lang}>
      <head>
        {/* Brand palette applied before first paint — no flash of unstyled color. */}
        <style nonce={nonce} dangerouslySetInnerHTML={{ __html: themeCss }} />
        {hasFonts && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
          </>
        )}
        {siteConfig.brand.fonts.stylesheets?.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {ANALYTICS_ENABLED && (
          <GoogleAnalytics
            gaId={GA4_ID}
            initialConsent={initialConsent}
            nonce={nonce}
          />
        )}

        {POSTHOG_ENABLED && (
          <PostHogProvider
            apiKey={POSTHOG_KEY}
            uiHost={POSTHOG_UI_HOST}
            requireConsent={siteConfig.analytics.enableConsentBanner}
            initialConsent={initialConsent}
          />
        )}

        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />

        {trackingEnabled && siteConfig.analytics.reportWebVitals && (
          <WebVitalsReporter />
        )}
        {trackingEnabled && (
          <ScrollDepthTracker
            thresholds={siteConfig.analytics.scrollDepthThresholds}
          />
        )}
        {trackingEnabled && <AiSourceTracker />}
        {trackingEnabled && siteConfig.analytics.enableConsentBanner && (
          <ConsentBanner />
        )}
      </body>
    </html>
  );
}
