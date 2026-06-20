/**
 * Client-side analytics layer. Every interactive element on the page routes
 * through `track()` so the event taxonomy stays consistent — which is exactly
 * what the weekly optimizer relies on when it reads GA4 to decide what to change.
 *
 * The `variant` of the active A/B test is attached to every event automatically,
 * so conversion can always be sliced by experiment arm.
 */

export const VARIANT_COOKIE = "lp_variant";

/**
 * Canonical event names — the single source of truth. optimizer/ga4.ts derives
 * its TRACKED_EVENTS list from these, so adding an event here keeps the reader in
 * sync automatically.
 */
export const EVENTS = {
  CTA_CLICK: "cta_click",
  SECTION_VIEW: "section_view",
  SCROLL_DEPTH: "scroll_depth",
  FORM_START: "form_start",
  FORM_SUBMIT: "form_submit",
  GENERATE_LEAD: "generate_lead",
  OUTBOUND_CLICK: "outbound_click",
  WEB_VITALS: "web_vitals",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export function getClientVariant(): string {
  if (typeof document === "undefined") return "A";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + VARIANT_COOKIE + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : "A";
}

/**
 * Queues a gtag command in the dataLayer using the `arguments` object — the exact
 * shape gtag.js replays once it loads. A plain array pushed to dataLayer is NOT
 * processed as a command, so this must use `arguments`, not `[...]`.
 */
function dataLayerPush(
  _command: "event" | "config" | "consent",
  _name: string,
  _params: Record<string, unknown>,
): void {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

/** Fire a GA4 event with the experiment variant always attached. */
export function track(
  name: EventName | string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const payload = { variant: getClientVariant(), ...params };
  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  } else {
    // gtag not ready yet — queue in gtag's own format so it replays on load.
    dataLayerPush("event", name, payload);
  }
}

/** Update Consent Mode v2 grants (called by the consent banner). */
export function setConsent(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const state = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}
