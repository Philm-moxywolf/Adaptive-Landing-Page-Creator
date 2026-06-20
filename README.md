# Adaptive Landing Page Creator

An AI-optimized, fully-instrumented, conversion-engineered landing-page engine.
**Configure once, deploy to Vercel, and let a weekly optimizer push every metric
past its target.**

It's built to convert cold traffic from *any* source — paid ads, SEO, AI search
(AISEO), and direct — and to keep getting better on its own:

- 🎯 **Research-driven page** — copy and structure derived from your ICP + offer.
- 📊 **Tracking on every element** — GA4 events for section views, CTA clicks,
  scroll depth, form funnel, Web Vitals; plus server-side conversion tracking.
- ♿ **Accessible by construction** — semantic HTML, ARIA, focus states, reduced-motion,
  consent banner (Consent Mode v2).
- 🔎 **Built for SEO + AISEO** — metadata, OpenGraph, sitemap/robots, and rich
  JSON-LD (Organization, Product, FAQ) that AI crawlers read.
- 🧪 **A/B variant framework** — deterministic bucketing via edge middleware.
- 🤖 **Weekly self-optimization** — every Saturday a Claude-powered agent reads GA4,
  re-researches the market, rewrites the page, and opens a PR with a Vercel preview.

> **This is a product you give to people.** Everything client-specific lives in
> `config/` and `content/`. A new client goes live by editing **two files** and
> setting env vars — never the engine in `src/`.

---

> **First time? → [Go-live guide](docs/GO-LIVE.md)** — the complete click-by-click walkthrough, ~30–45 minutes, no coding required.

## Run it from Claude Code (the console)

Open this repo in **Claude Code** and say _"set up my landing page."_ A control
console appears that walks you through connecting **your own** GitHub, Vercel, and
Google Analytics, deploying, and approving the weekly optimizer's edits — all from
chat, all on your accounts, nothing routed through anyone else. New here? See
[docs/GIFT-SETUP.md](docs/GIFT-SETUP.md).

## Deploy in one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPhilm-moxywolf%2FAdaptive-Landing-Page-Creator&env=NEXT_PUBLIC_SITE_URL,NEXT_PUBLIC_GA4_MEASUREMENT_ID&envDescription=Your%20public%20site%20URL%20and%20GA4%20Measurement%20ID&envLink=https%3A%2F%2Fgithub.com%2FPhilm-moxywolf%2FAdaptive-Landing-Page-Creator%2Fblob%2Fmain%2F.env.example)

One click clones this into your GitHub, creates the Vercel project, prompts for the
runtime env vars, and ships the first deploy — then every push auto-deploys.
*(The repo must be public for the clone flow. The weekly optimizer's secrets —
`ANTHROPIC_API_KEY`, `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_JSON` — are GitHub
Actions secrets, set separately; the console does this for you.)*

## The two files you edit

| File | What it controls |
| --- | --- |
| [`config/site.config.ts`](config/site.config.ts) | Brand colors, fonts, business info, GA4 ID, domain, conversion goal, experiments, **and the strategy brief (ICP, offer, objections, proof, voice) the optimizer reads.** |
| [`content/landing.json`](content/landing.json) | All page copy, as an ordered list of typed sections. This is what the AI rewrites. |

Plus `config/targets.config.ts` to set the conversion targets, and `.env.local`
for secrets (copy from [`.env.example`](.env.example)).

---

## Quickstart

```bash
npm install
cp .env.example .env.local      # then fill in your values
npm run dev                     # http://localhost:3000
```

Out of the box it runs a worked example (a fictional B2B offer) so you can see
every section. Replace the example with your own, then deploy.

```bash
npm run build                   # production build
npm run typecheck               # type safety across app + optimizer
npm run optimize:dry            # see what the weekly optimizer would change
```

**Full setup** (Vercel, GA4, domain, the weekly Action): see
[`docs/SETUP.md`](docs/SETUP.md).

---

## How the weekly optimizer works

Every Saturday, [`.github/workflows/optimize.yml`](.github/workflows/optimize.yml) runs:

```
GA4 (last 7 days) → score vs targets → live market research → AI rewrite
   → validate against the content schema → open a PR → Vercel preview
```

You review the PR (and its Vercel preview), then merge to ship. It keeps ratcheting
until every metric beats **120% of its target**. Details + the "120%" definition:
[`docs/OPTIMIZER.md`](docs/OPTIMIZER.md).

---

## Docs

- **[`docs/GO-LIVE.md`](docs/GO-LIVE.md) — the complete click-by-click walkthrough (start here).**
- [`docs/GIFT-SETUP.md`](docs/GIFT-SETUP.md) — the short setup overview.
- [`docs/SETUP.md`](docs/SETUP.md) — step-by-step: accounts, env vars, deploy, enable the Action.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the engine fits together.
- [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) — writing content + every section type.
- [`docs/OPTIMIZER.md`](docs/OPTIMIZER.md) — the Saturday loop, targets, and the 120% rule.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Zod · GA4 ·
`@anthropic-ai/sdk` (Claude Opus 4.8) · Vercel · GitHub Actions.
