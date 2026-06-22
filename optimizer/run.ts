import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { siteConfig } from "../config/site.config";
import { targetsConfig } from "../config/targets.config";
import { safeParseContent, type Content } from "../src/lib/content-schema";
import { fetchGa4Report } from "./ga4";
import { fetchPosthogReport } from "./posthog";
import { fetchGscReport } from "./gsc";
import { evaluateTargets, formatAttainment } from "./targets";
import { runResearch } from "./research";
import { optimizeContent } from "./optimize";
import { hasApiKey, OPTIMIZER_MODEL } from "./anthropic";

/**
 * Weekly optimizer entry point (run by .github/workflows/optimize.yml every
 * Saturday, or locally via `npm run optimize`).
 *
 *   GA4 pull → score targets → live research → AI rewrite → validate → write file + report
 *
 * The GitHub Action then commits the changed content + report and opens a PR,
 * which Vercel builds as a preview for review before it goes live.
 */

const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, "content", "landing.json");
const REPORTS_DIR = path.join(ROOT, "optimizer", "reports");

function loadContent(): Content {
  const raw = JSON.parse(readFileSync(CONTENT_PATH, "utf8"));
  const parsed = safeParseContent(raw);
  if (!parsed.success) {
    throw new Error(
      `Current content/landing.json is invalid:\n${parsed.error.issues
        .map((i) => `- ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }
  return parsed.data;
}

function writeReport(name: string, data: unknown) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(path.join(REPORTS_DIR, name), JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const stamp = new Date().toISOString();
  const dateKey = stamp.slice(0, 10);

  console.log(`\n▶ Adaptive Landing Page optimizer — ${stamp}`);
  console.log(`  model: ${OPTIMIZER_MODEL}${dryRun ? " (dry run)" : ""}\n`);

  // 1. Data
  const report = await fetchGa4Report(targetsConfig.evaluationWindowDays);
  const posthog = await fetchPosthogReport(targetsConfig.evaluationWindowDays).catch(
    () => null,
  );
  const gsc = await fetchGscReport(targetsConfig.evaluationWindowDays).catch(
    () => null,
  );

  // 2. Score against targets — combined metrics across all connected sources.
  const metrics: Record<string, number | null> = {
    ...(report?.metrics ?? {}),
    ...(gsc?.metrics ?? {}),
  };
  const targetEval = evaluateTargets(
    targetsConfig,
    Object.keys(metrics).length ? metrics : null,
  );
  console.log("Targets:");
  console.log(formatAttainment(targetEval));
  console.log(
    `\n  ${targetEval.achievedCount}/${targetEval.results.length} targets at stretch goal.\n`,
  );

  // Only skip when EVERY configured target is measured AND beaten — otherwise an
  // unmeasured target (e.g. no scroll/form data yet) could masquerade as "met".
  if (targetEval.dataAvailable && targetEval.allAchieved && targetEval.fullCoverage) {
    console.log("✓ All targets measured and already beaten by 20%. No rewrite needed this week.");
    writeReport(`${dateKey}.json`, {
      stamp,
      status: "all_targets_met",
      targetEval,
      report,
    });
    return;
  }

  if (!hasApiKey()) {
    console.warn(
      "⚠ ANTHROPIC_API_KEY not set — cannot run the rewrite. Reporting only.",
    );
    writeReport(`${dateKey}.json`, {
      stamp,
      status: "no_api_key",
      targetEval,
      report,
    });
    return;
  }

  const content = loadContent();

  // 3. Live research (best-effort)
  console.log("Researching market…");
  let research = "";
  try {
    research = await runResearch(siteConfig);
  } catch (e) {
    console.warn(`  research failed (continuing): ${(e as Error).message}`);
  }

  // 4. Rewrite
  console.log("Rewriting page for conversion…\n");
  const result = await optimizeContent({
    siteConfig,
    content,
    targetEval,
    report,
    posthog,
    gsc,
    research,
  });

  // 5. No-op guard — if the rewrite is identical to the current page (ignoring
  // bookkeeping), don't bump the version, write, or open a churn PR. Both objects
  // pass through the same schema, so key order is normalized and comparable.
  const { _meta: _newMeta, ...newBody } = result.content;
  const { _meta: _curMeta, ...currentBody } = content;
  if (JSON.stringify(newBody) === JSON.stringify(currentBody)) {
    console.log("✓ Optimizer produced no changes this week — nothing to ship.");
    writeReport(`${dateKey}.json`, {
      stamp,
      status: "no_change",
      model: OPTIMIZER_MODEL,
      rationale: result.rationale,
      targetEval,
      report,
    });
    return;
  }

  // 6. Merge bookkeeping + write
  const priorChangelog = content._meta?.changelog ?? [];
  const newContent: Content = {
    ...result.content,
    _meta: {
      version: (content._meta?.version ?? 1) + 1,
      lastOptimizedAt: stamp,
      changelog: [...priorChangelog.slice(-30), ...result.changelog],
    },
  };

  if (!dryRun) {
    writeFileSync(CONTENT_PATH, JSON.stringify(newContent, null, 2) + "\n");
    console.log(`✓ Wrote ${path.relative(ROOT, CONTENT_PATH)}`);
  } else {
    console.log("(dry run — content not written)");
  }

  writeReport(`${dateKey}.json`, {
    stamp,
    status: dryRun ? "dry_run" : "rewritten",
    model: OPTIMIZER_MODEL,
    rationale: result.rationale,
    changelog: result.changelog,
    targetEval,
    report,
    posthog,
    gsc,
    research,
  });

  console.log("\nRationale:");
  console.log(`  ${result.rationale}`);
  console.log("\nChanges:");
  for (const c of result.changelog) console.log(`  • ${c}`);
  console.log("");
}

main().catch((err) => {
  console.error("\n✗ Optimizer failed:", err);
  process.exit(1);
});
