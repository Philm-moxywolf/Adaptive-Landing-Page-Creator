import type { TargetsConfig, ConversionTarget } from "../src/lib/types";

/**
 * Scores each conversion target against the GA4 data and the "120% of target"
 * stretch goal. This is the objective function the weekly optimizer is trying to
 * maximize — every metric should clear `achieved: true`.
 */

export interface TargetAttainment {
  target: ConversionTarget;
  current: number | null;
  /** The stretch goal = target × stretchMultiplier (or ÷ for lower-is-better). */
  goal: number;
  /** 100 = exactly at goal, ≥100 = goal beaten. null when no data. */
  attainmentPct: number | null;
  achieved: boolean;
  /**
   * Whether this target's source is connected this run (its metric key is present
   * in the metrics map). An absent source (e.g. Search Console not set up) is "n/a"
   * — it must NOT count against coverage, or the "all targets beaten → skip" path
   * could never be reached. Present-but-null (connected, no data) IS applicable.
   */
  applicable: boolean;
  note?: string;
}

export interface TargetsEvaluation {
  dataAvailable: boolean;
  results: TargetAttainment[];
  allAchieved: boolean;
  achievedCount: number;
  /** True only when every APPLICABLE (connected-source) target has data. */
  fullCoverage: boolean;
}

export function evaluateTargets(
  config: TargetsConfig,
  /** Combined metric map across all sources (GA4 + Search Console + AIEO). */
  metrics: Record<string, number | null> | null,
): TargetsEvaluation {
  const m = config.stretchMultiplier;

  const results: TargetAttainment[] = config.targets.map((target) => {
    // Key PRESENT (even with a null value) = source connected this run → applicable.
    // Key ABSENT entirely = source not connected (e.g. no Search Console) → n/a.
    const applicable = metrics != null && target.metric in metrics;
    const current = applicable && metrics ? metrics[target.metric] ?? null : null;
    const higher = target.direction === "higher_is_better";
    const goal = higher ? target.target * m : target.target / m;

    if (current === null) {
      return {
        target,
        current: null,
        goal,
        attainmentPct: null,
        achieved: false,
        applicable,
        note: applicable
          ? "No data for this metric yet."
          : "Source not connected this run.",
      };
    }

    // Guard against divide-by-zero (e.g. bounce_rate of 0) producing Infinity.
    let attainmentPct: number;
    if (higher) {
      attainmentPct = goal > 0 ? (current / goal) * 100 : 100;
    } else {
      attainmentPct = current > 0 ? (goal / current) * 100 : 100;
    }
    const achieved = higher ? current >= goal : current <= goal;

    return { target, current, goal, attainmentPct, achieved, applicable: true };
  });

  const applicableResults = results.filter((r) => r.applicable);
  const withData = results.filter((r) => r.current !== null);
  const achievedCount = results.filter((r) => r.achieved).length;

  return {
    dataAvailable: metrics !== null && withData.length > 0,
    results,
    allAchieved: withData.length > 0 && withData.every((r) => r.achieved),
    achievedCount,
    // Coverage is over APPLICABLE targets only — a target whose source isn't
    // connected is n/a, so connecting only GA4 no longer blocks the skip path.
    fullCoverage:
      applicableResults.length > 0 && withData.length === applicableResults.length,
  };
}

export function formatAttainment(e: TargetsEvaluation): string {
  const lines = e.results.map((r) => {
    const cur = r.current === null ? "—" : r.current.toFixed(1);
    const pct = r.attainmentPct === null ? "—" : `${r.attainmentPct.toFixed(0)}%`;
    const mark = r.achieved ? "✓" : "✗";
    return `  ${mark} ${r.target.label}: current ${cur} / goal ${r.goal.toFixed(1)} (${pct} of stretch goal)`;
  });
  return lines.join("\n");
}
