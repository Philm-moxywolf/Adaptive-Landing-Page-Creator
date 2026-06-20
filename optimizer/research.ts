import type Anthropic from "@anthropic-ai/sdk";
import type { SiteConfig } from "../src/lib/types";
import { completeText } from "./anthropic";

/**
 * Live ICP/offer research via Claude's web search tool. Runs every Saturday so
 * the rewrite reflects current competitor messaging, objections, and language —
 * not a stale snapshot. Returns concise markdown notes consumed by the optimizer.
 */
export async function runResearch(config: SiteConfig): Promise<string> {
  const s = config.strategy;
  const system = [
    "You are a world-class conversion-rate-optimization researcher.",
    "You research a market and return tight, evidence-led notes a copywriter can act on immediately.",
    "Prefer recent sources. Be specific. No fluff, no preamble.",
  ].join(" ");

  const user = `Research the market for this offer and return concise markdown notes.

BUSINESS: ${config.business.name} (${config.business.domain})
OFFER: ${s.offer}
IDEAL CUSTOMER: ${s.icp}
KNOWN OBJECTIONS: ${s.objections.join("; ")}

Find and summarize, with sources where possible:
1. How direct competitors currently position a similar offer (headlines, hooks, guarantees).
2. The language real buyers use to describe this pain (forums, reviews, social).
3. Objections or trust gaps that commonly kill conversion for this category.
4. Proof elements that resonate in this category (specific stats, formats, social proof types).
5. 3–5 concrete, testable copy/structure ideas to lift conversion for THIS offer.

Keep it under ~600 words. Output markdown only.`;

  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search" },
  ];
  const notes = await completeText({ system, user, tools, maxTokens: 8000 });
  return sanitizeResearch(notes);
}

/**
 * Research is assembled from arbitrary web pages (competitor sites, forums) — it
 * is untrusted DATA, not instructions. Strip markup and cap size before it's fed
 * to the rewrite; the prompt also frames it explicitly as reference-only.
 */
function sanitizeResearch(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s{3,}/g, " ")
    .slice(0, 6000)
    .trim();
}
