"use client";

import { useEffect } from "react";
import { classifyAiReferrer } from "@/lib/ai-sources";
import { track, EVENTS } from "@/lib/analytics";

/**
 * Fires a single `ai_referral` event (with the source label) when the visitor
 * arrived from an AI answer engine — ChatGPT, Perplexity, Gemini, Copilot, etc.
 * Lets GA4/PostHog and the weekly optimizer measure AI-driven traffic, which the
 * default channel grouping lumps into "Referral" or "Direct".
 */
export function AiSourceTracker() {
  useEffect(() => {
    const source = classifyAiReferrer(document.referrer);
    if (source) track(EVENTS.AI_REFERRAL, { ai_source: source });
  }, []);
  return null;
}
