"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Reports Core Web Vitals to GA4. Page speed is both a ranking factor (SEO/AISEO)
 * and a conversion factor, so the optimizer watches these alongside conversion.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    const report = (metric: Metric) => {
      track(EVENTS.WEB_VITALS, {
        metric_name: metric.name,
        // CLS is sub-1; scale so GA4 stores a useful integer.
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_rating: metric.rating,
      });
    };
    onCLS(report);
    onINP(report);
    onLCP(report);
    onFCP(report);
    onTTFB(report);
  }, []);

  return null;
}
