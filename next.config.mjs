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
