# The weekly optimizer

Every Saturday, an autonomous agent reads your analytics, re-researches your market,
rewrites the page for conversion, and opens a pull request. You review the Vercel
preview and merge. It keeps going until every metric beats its target by 20%.

---

## What "achieve 120% of all metrics" means

A conversion *rate* can't exceed 100% in absolute terms, so "120%" is defined as
**120% of each target value you set** in `config/targets.config.ts` — i.e. beat the
goal by 20%.

- **Higher-is-better** metrics (conversion rate, CTA CTR, scroll depth, engagement):
  achieved when `current ≥ target × 1.2`.
- **Lower-is-better** metrics (bounce rate): achieved when `current ≤ target ÷ 1.2`.

`stretchMultiplier` (default `1.2`) controls the 20%. Once a goal is consistently
beaten, **raise the `target`** to ratchet performance up — the system is designed
to keep climbing, not to stop at a fixed number.

### The default targets

| Key | Metric | Default target |
| --- | --- | --- |
| `primary_cvr` | Sessions → lead conversion rate | 4.0% |
| `cta_ctr` | Primary CTA click-through rate | 12.0% |
| `scroll_75` | Sessions reaching 75% scroll | 45.0% |
| `form_completion` | Form start → submit | 60.0% |
| `engagement_rate` | GA4 engagement rate | 65.0% |
| `bounce_rate` | Bounce rate (lower is better) | 35.0% |

Set these from the client's real baseline + ambition. The defaults are illustrative.

---

## The Saturday pipeline

```
1. GA4 pull        last 7 days: sessions, conversions, engagement, bounce,
                   per-event counts, per-channel + per-variant breakdown
2. Score targets   compute attainment vs the 120% stretch goal for each metric
3. Research        Claude web-searches current competitor messaging, buyer
                   language, objections, and proof formats for your ICP/offer
4. Rewrite         Claude (Opus 4.8) rewrites content/landing.json — copy,
                   sections, offer, CTAs, proof — to close the gaps
5. Validate        the rewrite must pass the zod content schema (else one repair
                   attempt, else the run fails — a broken page never ships)
6. PR              the changed content is committed to a branch and a PR opens;
                   Vercel builds a preview for review
```

If **all targets are already met**, the optimizer reports success and skips the
rewrite that week. If GA4 has no data yet (new deployment), it runs in **cold-start
mode** — optimizing from research and CRO first principles to make the strongest
first version.

---

## Guardrails

- **Truthful by construction** — the optimizer may only cite proof listed in
  `strategy.proof`, and must never make any `strategy.forbiddenClaims`.
- **Schema-validated** — no malformed or off-spec output can reach production.
- **Human in the loop** — changes arrive as a reviewable PR with a Vercel preview,
  not a silent live edit. Merge to ship, close to discard.
- **Analytics continuity** — it preserves section `id`s and CTA `trackingId`s when
  a section keeps its role, so week-over-week comparisons stay valid.

Every run writes a report (rationale + changelog + the data it saw) to the
**optimizer-report** workflow artifact, and appends the changelog to
`content._meta.changelog`.

---

## Running it yourself

```bash
npm run optimize:dry     # full analysis + rewrite, writes nothing
npm run optimize         # writes content/landing.json locally
```

Both need `ANTHROPIC_API_KEY`; add `GA4_PROPERTY_ID` + GA4 service-account creds to
use real data (otherwise cold-start). In CI these come from GitHub secrets — see
[SETUP.md](SETUP.md) §5. Trigger a manual CI run from **Actions → Weekly conversion
optimizer → Run workflow**.

---

## Tuning

- **Change cadence** — edit the `cron` in `.github/workflows/optimize.yml`
  (`0 9 * * 6` = Saturdays 09:00 UTC).
- **Change the model** — set the `OPTIMIZER_MODEL` repo variable (default
  `claude-opus-4-8`).
- **Change the objective** — edit targets in `config/targets.config.ts`.
- **Change the strategy** — edit `strategy` in `config/site.config.ts`; the next
  run picks it up.
- **Auto-merge** — by default a human merges. If you want changes to ship without
  review, add an auto-merge step to the workflow (not recommended until you trust
  the output).
