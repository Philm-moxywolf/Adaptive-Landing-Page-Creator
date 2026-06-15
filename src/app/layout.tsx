import type { ReactNode } from "react";
import "./globals.css";
import { siteConfig, GA4_ID, ANALYTICS_ENABLED } from "@/lib/config";
import { buildThemeCss } from "@/lib/theme";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { WebVitalsReporter } from "@/components/tracking/WebVitalsReporter";
import { ScrollDepthTracker } from "@/components/tracking/ScrollDepthTracker";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const lang = siteConfig.seo.locale.split(/[_-]/)[0] || "en";

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeCss = buildThemeCss(siteConfig);

  return (
    <html lang={lang}>
      <head>
        {/* Brand palette applied before first paint — no flash of unstyled color. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
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
            enableConsentBanner={siteConfig.analytics.enableConsentBanner}
          />
        )}

        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />

        {ANALYTICS_ENABLED && siteConfig.analytics.reportWebVitals && (
          <WebVitalsReporter />
        )}
        {ANALYTICS_ENABLED && (
          <ScrollDepthTracker
            thresholds={siteConfig.analytics.scrollDepthThresholds}
          />
        )}
        {ANALYTICS_ENABLED && siteConfig.analytics.enableConsentBanner && (
          <ConsentBanner />
        )}
      </body>
    </html>
  );
}
