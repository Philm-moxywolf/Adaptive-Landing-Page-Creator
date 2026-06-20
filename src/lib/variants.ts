/**
 * Deterministic A/B variant assignment. Runs in the Edge middleware (so it must
 * stay free of Node APIs). A visitor is hashed to a stable bucket and pinned via
 * cookie, so they always see the same arm and conversions attribute correctly.
 */

import type { SiteConfig } from "./types";

/** FNV-1a 32-bit hash -> [0,1). Stable, fast, edge-safe. */
export function hashUnitInterval(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 to get unsigned, then normalize.
  return (h >>> 0) / 0xffffffff;
}

export function pickVariant(config: SiteConfig, seed: string): string {
  const variants = config.experiment.variants;
  if (!config.experiment.enabled || variants.length <= 1) {
    return variants[0] ?? "A";
  }
  const weights =
    config.experiment.weights && config.experiment.weights.length === variants.length
      ? config.experiment.weights
      : variants.map(() => 1 / variants.length);

  const r = hashUnitInterval(seed);
  let acc = 0;
  for (let i = 0; i < variants.length; i++) {
    acc += weights[i];
    if (r < acc) return variants[i];
  }
  return variants[variants.length - 1];
}
