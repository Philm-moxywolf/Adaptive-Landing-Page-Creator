import type { SiteConfig } from "./types";

/** "#4f46e5" | "#abc" -> "79 70 229" (space-separated RGB for Tailwind alpha support). */
export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const int = parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return "0 0 0";
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

/**
 * Builds the `:root` CSS-variable block from the client's brand config. Injected
 * inline in <head> so the brand palette is applied before first paint (no flash).
 */
export function buildThemeCss(config: SiteConfig): string {
  const c = config.brand.colors;
  const vars: Record<string, string> = {
    "--brand": hexToRgbTriplet(c.brand),
    "--brand-fg": hexToRgbTriplet(c.brandFg),
    "--brand-muted": hexToRgbTriplet(c.brandMuted),
    "--accent": hexToRgbTriplet(c.accent),
    "--accent-fg": hexToRgbTriplet(c.accentFg),
    "--bg": hexToRgbTriplet(c.bg),
    "--surface": hexToRgbTriplet(c.surface),
    "--ink": hexToRgbTriplet(c.ink),
    "--ink-muted": hexToRgbTriplet(c.inkMuted),
    "--line": hexToRgbTriplet(c.line),
    "--success": hexToRgbTriplet(c.success),
    "--radius": config.brand.radius,
    "--font-sans": `'${config.brand.fonts.sans}'`,
    "--font-display": `'${config.brand.fonts.display}'`,
  };
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `:root{${body}}`;
}
