import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { TrackedCTA } from "@/components/tracking/TrackedCTA";

export function SiteHeader() {
  const { logo } = siteConfig.brand;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="container-lp flex h-16 items-center justify-between">
        <a
          href="#main"
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink"
        >
          {logo.src ? (
            <Image src={logo.src} alt={siteConfig.business.name} width={120} height={28} className="h-7 w-auto" />
          ) : (
            <span>{logo.wordmark}</span>
          )}
        </a>
        <TrackedCTA
          cta={{
            label: "Get started",
            href: siteConfig.conversion.primaryCtaHref,
            kind: "primary",
            trackingId: "nav_cta",
          }}
          location="nav"
          className="px-4 py-2 text-sm"
        />
      </div>
    </header>
  );
}
