/**
 * Image optimization hosts are an explicit allowlist (NOT a wildcard) to avoid
 * turning /_next/image into an open proxy. Allowed hosts are derived from the
 * site URL plus an optional NEXT_PUBLIC_IMAGE_HOSTS env (comma-separated). With
 * none set, only same-origin/local images are allowed — the safe default.
 */
const siteHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname;
  } catch {
    return "";
  }
})();

const imageHosts = [
  ...new Set(
    [siteHost, ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS || "").split(",")]
      .map((h) => h.trim())
      .filter(Boolean),
  ),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  // PostHog reverse proxy: all analytics traffic flows through this first-party
  // path, so it dodges ad-blockers AND the strict CSP needs no posthog.com hosts
  // ('self' already covers it). Order matters: static/array before the catch-all.
  // The /r7x prefix is intentionally non-obvious (paths like /analytics get blocked).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const region = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "").includes("eu") ? "eu" : "us";
    return [
      { source: "/r7x/static/:path*", destination: `https://${region}-assets.i.posthog.com/static/:path*` },
      { source: "/r7x/array/:path*", destination: `https://${region}-assets.i.posthog.com/array/:path*` },
      { source: "/r7x/:path*", destination: `https://${region}.i.posthog.com/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
