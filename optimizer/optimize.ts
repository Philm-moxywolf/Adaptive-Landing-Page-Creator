import type { SiteConfig } from "../src/lib/types";
import { safeParseContent, type Content } from "../src/lib/content-schema";
import { completeText } from "./anthropic";
import { buildOptimizerPrompt } from "./prompt";
import type { TargetsEvaluation } from "./targets";
import type { Ga4Report } from "./ga4";
import type { PosthogReport } from "./posthog";
import type { GscReport } from "./gsc";

export interface OptimizeResult {
  content: Content;
  rationale: string;
  changelog: string[];
}

/** Pulls the first balanced top-level JSON object out of a model response. */
function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

function validate(
  raw: string,
): { ok: true; value: OptimizeResult } | { ok: false; error: string } {
  const json = extractJsonObject(raw);
  if (!json) return { ok: false, error: "No JSON object found in the response." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: `JSON.parse failed: ${(e as Error).message}` };
  }

  const wrapper = parsed as {
    content?: unknown;
    rationale?: unknown;
    changelog?: unknown;
  };
  if (!wrapper || typeof wrapper !== "object" || !("content" in wrapper)) {
    return { ok: false, error: 'Top-level object must have a "content" field.' };
  }

  const result = safeParseContent(wrapper.content);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 12)
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    return { ok: false, error: `content failed schema validation:\n${issues}` };
  }

  return {
    ok: true,
    value: {
      content: result.data,
      rationale:
        typeof wrapper.rationale === "string" ? wrapper.rationale : "",
      changelog: Array.isArray(wrapper.changelog)
        ? wrapper.changelog.filter((c): c is string => typeof c === "string")
        : [],
    },
  };
}

export async function optimizeContent(args: {
  siteConfig: SiteConfig;
  content: Content;
  targetEval: TargetsEvaluation;
  report: Ga4Report | null;
  posthog: PosthogReport | null;
  gsc: GscReport | null;
  citations: string | null;
  research: string;
}): Promise<OptimizeResult> {
  const { system, user } = buildOptimizerPrompt(args);

  let raw = await completeText({ system, user, maxTokens: 64000 });
  let checked = validate(raw);

  if (!checked.ok) {
    // One repair attempt with the validation errors fed back in.
    const repairUser = `${user}

Your previous output was INVALID and was rejected:
${checked.error}

Return ONLY the corrected JSON object. Fix every issue above.`;
    raw = await completeText({ system, user: repairUser, maxTokens: 64000 });
    checked = validate(raw);
    if (!checked.ok) {
      throw new Error(
        `Optimizer produced invalid content after one repair attempt:\n${checked.error}`,
      );
    }
  }

  return checked.value;
}
