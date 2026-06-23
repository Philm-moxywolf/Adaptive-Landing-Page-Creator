"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { getClientVariant } from "@/lib/analytics";

/**
 * Initializes PostHog (product analytics + session replay + heatmaps), gated on a
 * project key and wired to the same Consent Mode v2 banner as GA4. Ingestion is
 * proxied through /r7x (see next.config.mjs) so the strict CSP needs no PostHog
 * hosts. Session replay is sampled (~30%) and masks all inputs (lead-form PII).
 * The active A/B variant is registered as a super-property on every event.
 */
export function PostHogProvider({
  apiKey,
  uiHost,
  requireConsent,
  initialConsent,
}: {
  apiKey: string;
  uiHost: string;
  requireConsent: boolean;
  initialConsent: "granted" | "denied";
}) {
  useEffect(() => {
    if (typeof window === "undefined" || window.posthog) return;
    posthog.init(apiKey, {
      api_host: "/r7x",
      ui_host: uiHost,
      capture_pageview: false, // App Router: captured manually below
      capture_pageleave: true,
      person_profiles: "identified_only",
      autocapture: true,
      disable_session_recording: Math.random() >= 0.3, // ~30% sampled
      session_recording: { maskAllInputs: true },
      // Honor the consent banner: start opted out until the visitor accepts.
      opt_out_capturing_by_default: requireConsent && initialConsent !== "granted",
      loaded: (ph) => ph.register({ variant: getClientVariant() }),
    });
    window.posthog = posthog as unknown as Window["posthog"];
  }, [apiKey, uiHost, requireConsent, initialConsent]);

  const pathname = usePathname();
  useEffect(() => {
    window.posthog?.capture("$pageview");
  }, [pathname]);

  return null;
}
