import type Anthropic from "@anthropic-ai/sdk";
import type { SiteConfig } from "../src/lib/types";
import { completeText } from "./anthropic";

/**
 * Weekly AI-answer-visibility check (AIEO). Uses Claude's web search to see whether
 * the brand surfaces in AI assistant answers for buyer-intent queries, and returns
 * concrete actions to improve citation odds. Best-effort: the optimizer feeds the
 * result into the rewrite as untrusted reference data, and continues if it fails.
 */
export async function runCitationCheck(config: SiteConfig): Promise<string> {
  const s = config.strategy;
  const system = [
    "You are an AI-search-visibility analyst.",
    "You check whether a specific brand surfaces in AI assistant answers for buyer-intent queries,",
    "and you report only what the live web search actually supports — never invent citations.",
  ].join(" ");

  const user = `Using web search, assess whether "${config.business.name}" (${config.business.domain}) shows up when a buyer researches this offer with an AI assistant.

OFFER: ${s.offer}
IDEAL CUSTOMER: ${s.icp}

Run 3-4 realistic buyer-intent queries (e.g. "best <category> for <ICP>", "<offer> reviews", "alternatives to <known competitor>"). For each, report:
- the query
- whether ${config.business.name} appears, and which competitors are cited instead
Then give 2-3 concrete, on-page actions to improve THIS page's odds of being cited in AI answers (entities to name, structured facts/comparisons to add, FAQ Q&As that match how buyers ask). Keep under ~350 words. Markdown only.`;

  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search" },
  ];
  const out = await completeText({ system, user, tools, maxTokens: 6000 });
  // Untrusted (assembled from web pages) — strip markup + cap before it's fed on.
  return out
    .replace(/<[^>]*>/g, " ")
    .replace(/\s{3,}/g, " ")
    .slice(0, 4000)
    .trim();
}
