import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { safeParseContent, sectionSchema } from "../src/lib/content-schema";
import { evaluateTargets } from "../optimizer/targets";
import type { TargetsConfig } from "../src/lib/types";
import { pickVariant, hashUnitInterval } from "../src/lib/variants";
import { hexToRgbTriplet } from "../src/lib/theme";
import { cn, ctaClasses, slugify } from "../src/lib/cn";

// ── Content schema ──────────────────────────────────────────────────────────
test("content schema validates the shipped landing.json", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../content/landing.json", import.meta.url), "utf8"),
  );
  const parsed = safeParseContent(raw);
  assert.equal(parsed.success, true, "shipped content must be schema-valid");
  if (parsed.success) {
    assert.ok(parsed.data.sections.length > 0);
    assert.ok(parsed.data.sections.some((s) => s.type === "hero"));
    assert.ok(parsed.data.sections.some((s) => s.type === "leadForm"));
  }
});

test("content schema rejects malformed content and bad section types", () => {
  assert.equal(safeParseContent({}).success, false);
  assert.equal(safeParseContent({ meta: {}, sections: [] }).success, false);
  const badSection = sectionSchema.safeParse({ id: "x", type: "not-a-real-type" });
  assert.equal(badSection.success, false);
});

// ── Optimizer target math (the part testable without live GA4) ───────────────
const targetsCfg: TargetsConfig = {
  stretchMultiplier: 1.2,
  evaluationWindowDays: 7,
  targets: [
    { key: "cvr", label: "CVR", metric: "conversion_rate", unit: "percent", direction: "higher_is_better", target: 4 },
    { key: "bounce", label: "Bounce", metric: "bounce_rate", unit: "percent", direction: "lower_is_better", target: 35 },
  ],
};

test("evaluateTargets: higher-is-better stretch goal + attainment", () => {
  const e = evaluateTargets(targetsCfg, { conversion_rate: 6, bounce_rate: 20 });
  const cvr = e.results.find((r) => r.target.key === "cvr")!;
  assert.equal(cvr.goal, 4.8); // 4 × 1.2
  assert.equal(cvr.achieved, true); // 6 ≥ 4.8
  assert.ok(Math.abs(cvr.attainmentPct! - 125) < 0.001);
});

test("evaluateTargets: lower-is-better guards divide-by-zero (no Infinity)", () => {
  const e = evaluateTargets(targetsCfg, { conversion_rate: 6, bounce_rate: 0 });
  const bounce = e.results.find((r) => r.target.key === "bounce")!;
  assert.equal(bounce.goal, 35 / 1.2);
  assert.equal(bounce.achieved, true); // 0 ≤ goal
  assert.equal(Number.isFinite(bounce.attainmentPct!), true);
  assert.equal(bounce.attainmentPct, 100); // guarded, not Infinity
});

test("evaluateTargets: coverage + no-data behaviour", () => {
  const full = evaluateTargets(targetsCfg, { conversion_rate: 6, bounce_rate: 20 });
  assert.equal(full.fullCoverage, true);
  assert.equal(full.allAchieved, true);

  const partial = evaluateTargets(targetsCfg, { conversion_rate: 6, bounce_rate: null });
  assert.equal(partial.fullCoverage, false); // bounce unmeasured

  const none = evaluateTargets(targetsCfg, null);
  assert.equal(none.dataAvailable, false);
  assert.equal(none.allAchieved, false);
  assert.equal(none.fullCoverage, false);
});

test("evaluateTargets scores SEO metrics (Search Console) from the combined map", () => {
  const seoCfg: TargetsConfig = {
    stretchMultiplier: 1.2,
    evaluationWindowDays: 7,
    targets: [
      { key: "octr", label: "CTR", metric: "organic_ctr", unit: "percent", direction: "higher_is_better", target: 3 },
      { key: "pos", label: "Pos", metric: "avg_position", unit: "ratio", direction: "lower_is_better", target: 10 },
    ],
  };
  const e = evaluateTargets(seoCfg, { organic_ctr: 4, avg_position: 6 });
  assert.equal(e.results.find((r) => r.target.key === "octr")!.achieved, true); // 4 ≥ 3.6
  assert.equal(e.results.find((r) => r.target.key === "pos")!.achieved, true); // 6 ≤ 8.33
});

// ── A/B variant assignment ───────────────────────────────────────────────────
const cfg = (over: Partial<{ enabled: boolean; variants: string[]; weights: number[] }> = {}) =>
  ({ experiment: { enabled: true, variants: ["A", "B"], ...over } } as never);

test("pickVariant is deterministic and stays in-range", () => {
  const a = pickVariant(cfg(), "seed-123");
  const b = pickVariant(cfg(), "seed-123");
  assert.equal(a, b);
  assert.ok(["A", "B"].includes(a));
});

test("pickVariant respects disabled experiments and splits traffic", () => {
  assert.equal(pickVariant(cfg({ enabled: false }), "x"), "A");
  const counts = { A: 0, B: 0 } as Record<string, number>;
  for (let i = 0; i < 400; i++) counts[pickVariant(cfg(), "s" + i)]++;
  assert.ok(counts.A > 100 && counts.B > 100, "both arms should get meaningful traffic");
});

test("hashUnitInterval returns [0,1)", () => {
  for (const s of ["", "a", "longer-seed", "🚀"]) {
    const v = hashUnitInterval(s);
    assert.ok(v >= 0 && v < 1);
  }
});

// ── Theme + utils ────────────────────────────────────────────────────────────
test("hexToRgbTriplet converts and degrades safely", () => {
  assert.equal(hexToRgbTriplet("#4f46e5"), "79 70 229");
  assert.equal(hexToRgbTriplet("#abc"), "170 187 204");
  assert.equal(hexToRgbTriplet("not-a-hex"), "0 0 0");
});

test("cn / slugify / ctaClasses", () => {
  assert.equal(cn("a", false, null, "b"), "a b");
  assert.equal(slugify("Get my free AI audit!"), "get_my_free_ai_audit");
  assert.ok(ctaClasses("primary").includes("bg-brand"));
  assert.ok(ctaClasses("secondary").includes("border"));
});
