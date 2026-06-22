import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@config/site.config";
import { pickVariant } from "@/lib/variants";
import { VARIANT_COOKIE } from "@/lib/analytics";

/**
 * Edge middleware does two things on every page request:
 *
 * 1. **Content-Security-Policy with a per-request nonce.** The nonce is forwarded
 *    on the request (so layout/page can stamp it onto their inline <style>/<script>
 *    and Next stamps it onto its own bootstrap scripts) and the CSP is set on the
 *    response. Applied in production only, so local dev (HMR needs unsafe-eval) is
 *    untouched.
 * 2. **A/B variant assignment** — pinned via cookie AND injected into THIS request's
 *    cookie header, so the very first render already matches the assigned arm
 *    (no first-visit mismatch).
 */
function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isProd = process.env.NODE_ENV === "production";
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js derives the nonce for its OWN inline bootstrap/RSC-data scripts from
  // the request CSP header (not from x-nonce). Forward it here — prod only, to
  // match the response gating — or those scripts ship unnonced and the strict
  // script-src blocks hydration in production.
  if (isProd) requestHeaders.set("Content-Security-Policy", csp);

  // A/B variant: assign if missing/invalid, and make it visible on THIS render.
  let assignedVariant: string | null = null;
  if (siteConfig.experiment.enabled) {
    const existing = req.cookies.get(VARIANT_COOKIE)?.value;
    if (!existing || !siteConfig.experiment.variants.includes(existing)) {
      const seed = req.cookies.get("_ga")?.value || crypto.randomUUID();
      assignedVariant = pickVariant(siteConfig, seed);
      const cookieHeader = req.headers.get("cookie");
      requestHeaders.set(
        "cookie",
        cookieHeader
          ? `${cookieHeader}; ${VARIANT_COOKIE}=${assignedVariant}`
          : `${VARIANT_COOKIE}=${assignedVariant}`,
      );
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (isProd) {
    res.headers.set("Content-Security-Policy", csp);
  }
  if (assignedVariant) {
    res.cookies.set(VARIANT_COOKIE, assignedVariant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  // Run on page documents only — skip static assets, API routes, the PostHog
  // proxy (/r7x), and files.
  matcher: ["/((?!_next/static|_next/image|api|r7x|favicon.ico|.*\\..*).*)"],
};
