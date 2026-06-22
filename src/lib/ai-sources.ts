/**
 * Single source of truth for AI-engine detection (the lists churn fast — update here).
 * Pure + edge-safe (no imports), so it's usable from middleware AND the client.
 */

/** AI crawler user-agents (search + training), 2026. */
export const AI_CRAWLER_UA =
  /GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|Claude-SearchBot|Claude-User|ClaudeBot|anthropic-ai|Google-Extended|Bytespider|Amazonbot|Applebot-Extended|CCBot|meta-externalagent|cohere-ai|DuckAssistBot/i;

/** AI crawlers that power ANSWER/SEARCH features (worth allowing for AIEO visibility). */
export const AI_SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "DuckAssistBot",
];

/** AI crawlers used primarily for TRAINING (block these under "search-only"). */
export const AI_TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "meta-externalagent",
  "cohere-ai",
];

/** Returns the matched AI crawler name, or null. */
export function matchAiCrawler(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const m = userAgent.match(AI_CRAWLER_UA);
  return m ? m[0] : null;
}

const AI_REFERRER =
  /chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com\/chat|claude\.ai|you\.com|phind\.com|deepseek\.com|grok\.com/i;

/** Classifies a referrer URL into an AI source label (e.g. "chatgpt"), or null. */
export function classifyAiReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  const m = referrer.match(AI_REFERRER);
  if (!m) return null;
  const host = m[0].toLowerCase();
  if (host.includes("chatgpt") || host.includes("openai")) return "chatgpt";
  if (host.includes("perplexity")) return "perplexity";
  if (host.includes("gemini") || host.includes("bard")) return "gemini";
  if (host.includes("copilot") || host.includes("bing")) return "copilot";
  if (host.includes("claude")) return "claude";
  if (host.includes("deepseek")) return "deepseek";
  if (host.includes("grok")) return "grok";
  return host.replace(/\..*$/, "");
}
