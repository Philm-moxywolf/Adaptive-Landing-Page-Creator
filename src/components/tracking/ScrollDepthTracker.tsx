"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Fires a `scroll_depth` event once per configured threshold (e.g. 25/50/75/90%).
 * Layout reads (scrollHeight/innerHeight) are cached and only recomputed on resize,
 * and measurement is rAF-throttled, so the scroll handler doesn't force reflow on
 * every scroll event.
 */
export function ScrollDepthTracker({ thresholds }: { thresholds: number[] }) {
  useEffect(() => {
    const sorted = [...thresholds].sort((a, b) => a - b);
    const fired = new Set<number>();
    let ticking = false;
    let rafId = 0;
    let viewport = window.innerHeight;
    let docHeight = document.documentElement.scrollHeight;

    function measure() {
      ticking = false;
      const max = docHeight - viewport;
      const percent =
        max <= 0 ? 100 : (document.documentElement.scrollTop / max) * 100;
      for (const t of sorted) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          track(EVENTS.SCROLL_DEPTH, { percent: t });
        }
      }
      if (fired.size === sorted.length) cleanup();
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(measure);
      }
    }
    function onResize() {
      viewport = window.innerHeight;
      docHeight = document.documentElement.scrollHeight;
    }
    function cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    measure();
    return cleanup;
  }, [thresholds]);

  return null;
}
