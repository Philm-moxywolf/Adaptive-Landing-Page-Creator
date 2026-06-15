import type { TargetsConfig, ConversionTarget } from "../src/lib/types";
import type { Ga4Report } from "./ga4";

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
  note?: string;
}

export interface TargetsEvaluation {
  dataAvailable: boolean;
  results: TargetAttainment[];
  allAchieved: boolean;
  achievedCount: number;
}

export function evaluateTargets(
  config: TargetsConfig,
  report: Ga4Report | null,
): TargetsEvaluation {
  const m = config.stretchMultiplier;

  const results: TargetAttainment[] = config.targets.map((target) => {
    const current = report?.metrics[target.metric] ?? null;
    const higher = target.direction === "higher_is_better";
    const goal = higher ? target.target * m : target.target / m;

    if (current === null) {
      return {
        target,
        current: null,
        goal,
        attainmentPct: null,
        achieved: false,
        note: "No data for this metric yet.",
      };
    }

    const attainmentPct = higher
      ? (current / goal) * 100
      : (goal / current) * 100;
    const achieved = higher ? current >= goal : current <= goal;

    return { target, current, goal, attainmentPct, achieved };
  });

  const withData = results.filter((r) => r.current !== null);
  const achievedCount = results.filter((r) => r.achieved).length;

  return {
    dataAvailable: report !== null && withData.length > 0,
    results,
    allAchieved: withData.length > 0 && withData.every((r) => r.achieved),
    achievedCount,
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
