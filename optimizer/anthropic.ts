import Anthropic from "@anthropic-ai/sdk";

/**
 * Thin wrapper around the Anthropic Messages API for the optimizer.
 *
 * Uses Claude Opus 4.8 with adaptive thinking + high effort — the right tier for
 * a weekly job that reasons over analytics, research, and CRO strategy to rewrite
 * a page. Streams (to avoid HTTP timeouts on large outputs), accumulates text
 * across the `pause_turn` server-tool loop (so web-search turns aren't lost), and
 * throws loudly if the model ultimately produced nothing.
 */

export const OPTIMIZER_MODEL = process.env.OPTIMIZER_MODEL || "claude-opus-4-8";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface CompleteArgs {
  system: string;
  user: string;
  tools?: Anthropic.ToolUnion[];
  maxTokens?: number;
}

export async function completeText({
  system,
  user,
  tools,
  maxTokens = 32000,
}: CompleteArgs): Promise<string> {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];

  const collected: string[] = [];
  let lastStop: string | null = null;

  for (let i = 0; i < 8; i++) {
    const params: Anthropic.MessageStreamParams = {
      model: OPTIMIZER_MODEL,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system,
      messages,
      ...(tools ? { tools } : {}),
    };

    const stream = client.messages.stream(params);
    const msg = await stream.finalMessage();
    lastStop = msg.stop_reason;

    const turnText = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (turnText) collected.push(turnText);

    // Server-side tools (web search) may pause; resend to resume, keeping text.
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    break;
  }

  const text = collected.join("\n").trim();
  if (!text) {
    throw new Error(
      `Model produced no text output (last stop_reason: ${lastStop ?? "none"}).`,
    );
  }
  return text;
}
