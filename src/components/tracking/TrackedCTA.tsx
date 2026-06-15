"use client";

import type { ReactNode } from "react";
import { track, EVENTS } from "@/lib/analytics";
import type { Cta } from "@/lib/content-schema";
import { cn, ctaClasses, slugify } from "@/lib/cn";

/**
 * Every call-to-action on the page is a TrackedCTA. It emits `cta_click` (and
 * `outbound_click` for external links) with a stable id + on-page location, so the
 * optimizer can compute per-CTA click-through rate and test new copy/placement.
 */
export function TrackedCTA({
  cta,
  location,
  className,
  children,
  fullWidth,
}: {
  cta: Cta;
  /** Where on the page this CTA lives, e.g. "hero", "offer", "final". */
  location: string;
  className?: string;
  children?: ReactNode;
  fullWidth?: boolean;
}) {
  const isExternal = /^https?:\/\//i.test(cta.href);
  const trackingId = cta.trackingId || slugify(cta.label);

  function handleClick() {
    track(EVENTS.CTA_CLICK, {
      cta_id: trackingId,
      cta_label: cta.label,
      location,
      href: cta.href,
    });
    if (isExternal) {
      track(EVENTS.OUTBOUND_CLICK, { href: cta.href, cta_id: trackingId });
    }
  }

  return (
    <a
      href={cta.href}
      onClick={handleClick}
      aria-label={cta.ariaLabel || cta.label}
      data-cta-id={trackingId}
      className={cn(
        ctaClasses(cta.kind),
        fullWidth && "w-full",
        className,
      )}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children ?? cta.label}
    </a>
  );
}
