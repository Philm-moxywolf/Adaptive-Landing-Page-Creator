import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@config/site.config";
import { pickVariant } from "@/lib/variants";
import { VARIANT_COOKIE } from "@/lib/analytics";

/**
 * Edge middleware: pins each visitor to a stable A/B variant via cookie so they
 * see a consistent page and conversions attribute to the right arm. No-ops when
 * experiments are disabled in site.config.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!siteConfig.experiment.enabled) return res;

  const existing = req.cookies.get(VARIANT_COOKIE)?.value;
  if (existing && siteConfig.experiment.variants.includes(existing)) return res;

  // Seed from the GA client id if present (stable per browser), else a fresh id.
  const seed = req.cookies.get("_ga")?.value || crypto.randomUUID();
  const variant = pickVariant(siteConfig, seed);

  res.cookies.set(VARIANT_COOKIE, variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  // Run on pages only — skip static assets, API routes, and files with extensions.
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)"],
};
