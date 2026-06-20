"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Reports Core Web Vitals to GA4. The web-vitals library is dynamically imported
 * so it's code-split out of the main bundle and only loaded after hydration.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;
    const report = (metric: Metric) => {
      track(EVENTS.WEB_VITALS, {
        metric_name: metric.name,
        // CLS is sub-1; scale so GA4 stores a useful integer.
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_rating: metric.rating,
      });
    };
    import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      if (cancelled) return;
      onCLS(report);
      onINP(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
