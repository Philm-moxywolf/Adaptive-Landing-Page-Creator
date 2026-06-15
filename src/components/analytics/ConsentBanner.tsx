"use client";

import { useEffect, useState } from "react";
import { setConsent } from "@/lib/analytics";
import { ctaClasses } from "@/lib/cn";

const CONSENT_COOKIE = "lp_consent";

/**
 * Minimal, accessible Consent Mode v2 banner. Persists the choice in a cookie and
 * updates GA4 consent grants. Only rendered when enableConsentBanner is true.
 */
export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )lp_consent=([^;]*)/);
    if (!match) {
      setShow(true);
    } else {
      setConsent(match[1] === "granted");
    }
  }, []);

  function choose(granted: boolean) {
    document.cookie = `${CONSENT_COOKIE}=${granted ? "granted" : "denied"}; path=/; max-age=${
      60 * 60 * 24 * 180
    }; samesite=lax`;
    setConsent(granted);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-brand border border-line bg-surface p-4 shadow-xl sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          We use cookies to measure and improve this page. You can accept or
          decline analytics.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className={ctaClasses("secondary") + " px-4 py-2 text-sm"}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className={ctaClasses("primary") + " px-4 py-2 text-sm"}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
