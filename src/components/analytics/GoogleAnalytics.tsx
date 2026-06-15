"use client";

import Script from "next/script";

/**
 * Loads GA4 (gtag.js) with Consent Mode v2. When a consent banner is enabled,
 * analytics/ads storage default to "denied" until the visitor accepts — the
 * privacy-correct default for EU/UK traffic. With the banner off, consent
 * defaults to granted.
 */
export function GoogleAnalytics({
  gaId,
  enableConsentBanner,
}: {
  gaId: string;
  enableConsentBanner: boolean;
}) {
  if (!gaId) return null;
  const def = enableConsentBanner ? "denied" : "granted";

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: '${def}',
            ad_user_data: '${def}',
            ad_personalization: '${def}',
            analytics_storage: '${def}',
            wait_for_update: 500
          });
          gtag('config', '${gaId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
