"use client";

import { useEffect } from "react";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Fires a `scroll_depth` event once per configured threshold (e.g. 25/50/75/90%).
 * Scroll depth is one of the strongest predictors of intent on a landing page and
 * a key input to the `scroll_75_rate` target.
 */
export function ScrollDepthTracker({ thresholds }: { thresholds: number[] }) {
  useEffect(() => {
    const sorted = [...thresholds].sort((a, b) => a - b);
    const fired = new Set<number>();

    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const percent = max <= 0 ? 100 : (doc.scrollTop / max) * 100;
      for (const t of sorted) {
        if (percent >= t && !fired.has(t)) {
          fired.add(t);
          track(EVENTS.SCROLL_DEPTH, { percent: t });
        }
      }
      if (fired.size === sorted.length) {
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholds]);

  return null;
}
