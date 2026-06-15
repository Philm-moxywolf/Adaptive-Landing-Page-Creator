"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Wraps a page section in a semantic <section> and fires a one-time `section_view`
 * event when ≥40% of it enters the viewport. This is how the optimizer learns which
 * sections people actually reach — the raw material for reorder/cut/rewrite decisions.
 */
export function TrackedSection({
  id,
  sectionType,
  children,
  className,
  ariaLabel,
}: {
  id: string;
  sectionType: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            track(EVENTS.SECTION_VIEW, {
              section_id: id,
              section_type: sectionType,
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id, sectionType]);

  return (
    <section ref={ref} id={id} aria-label={ariaLabel} className={className}>
      {children}
    </section>
  );
}
