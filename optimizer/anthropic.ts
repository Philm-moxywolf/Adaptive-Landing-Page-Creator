import Anthropic from "@anthropic-ai/sdk";

/**
 * Thin wrapper around the Anthropic Messages API for the optimizer.
 *
 * Uses Claude Opus 4.8 with adaptive thinking + high effort — the right tier for
 * a weekly job that reasons over analytics, research, and CRO strategy to rewrite
 * a page. Streams (to avoid HTTP timeouts on large outputs) and handles the
 * `pause_turn` server-tool loop so web search can run to completion.
 *
 * Note: request params are cast to `any` at the SDK boundary so the build stays
 * resilient across SDK minor versions — the field shapes (adaptive thinking,
 * output_config.effort, web_search tool) are per the current Claude API docs.
 */

export const OPTIMIZER_MODEL = process.env.OPTIMIZER_MODEL || "claude-opus-4-8";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface CompleteArgs {
  system: string;
  user: string;
  tools?: unknown[];
  maxTokens?: number;
}

export async function completeText({
  system,
  user,
  tools,
  maxTokens = 32000,
}: CompleteArgs): Promise<string> {
  const client = new Anthropic();
  const messages: Array<{ role: "user" | "assistant"; content: unknown }> = [
    { role: "user", content: user },
  ];

  let text = "";
  for (let i = 0; i < 8; i++) {
    const params = {
      model: OPTIMIZER_MODEL,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system,
      messages,
      ...(tools ? { tools } : {}),
    };

    const stream = client.messages.stream(params as never);
    const msg = await stream.finalMessage();

    text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    // Server-side tools (web search) may pause; resend to resume.
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    break;
  }
  return text;
}
