import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteConfig.seo.defaultTitle;

/**
 * Dynamically generated, on-brand social share image. Renders at build/request time
 * from the brand palette + headline, so clients get a polished OG card with zero
 * design work. Replace with a static /public image + config.seo.defaultOgImage if
 * a bespoke card is preferred.
 */
export default function OpengraphImage() {
  const c = siteConfig.brand.colors;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: c.bg,
          color: c.ink,
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: c.brand }}>
          {siteConfig.business.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            marginTop: 28,
            lineHeight: 1.08,
            maxWidth: 980,
          }}
        >
          {siteConfig.seo.defaultTitle}
        </div>
      </div>
    ),
    { ...size },
  );
}
