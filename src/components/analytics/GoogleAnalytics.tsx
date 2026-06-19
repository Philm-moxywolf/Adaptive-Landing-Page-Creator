"use client";

import Script from "next/script";

/**
 * Loads GA4 (gtag.js) with Consent Mode v2. `initialConsent` is resolved on the
 * server from the visitor's saved choice, so a returning visitor who already
 * accepted is not reset to "denied" on first paint. The GA id is sanitized to a
 * safe charset before it's interpolated into the inline script.
 */
export function GoogleAnalytics({
  gaId,
  initialConsent,
  nonce,
}: {
  gaId: string;
  initialConsent: "granted" | "denied";
  nonce?: string;
}) {
  const safeId = gaId.replace(/[^A-Za-z0-9-]/g, "");
  if (!safeId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(safeId)}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: '${initialConsent}',
            ad_user_data: '${initialConsent}',
            ad_personalization: '${initialConsent}',
            analytics_storage: '${initialConsent}',
            wait_for_update: 500
          });
          gtag('config', '${safeId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
