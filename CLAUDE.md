# Adaptive Landing Page Creator — project instructions

This repo is a self-optimizing landing page that the owner runs in **their own Claude Code**, on **their own accounts**. Claude Code is the control surface.

## On first interaction, offer the console

When the user starts working in this project — or asks to set up, deploy, go live, connect accounts, or review the weekly optimizer's edits — **proactively offer to launch the Landing Page Console** by using the `landing-console` skill. It renders an in-chat control panel and walks the user through everything (connect GitHub / Vercel / Google Analytics, deploy, and weekly sign-off).

A good opener: _"Want me to open the Landing Page Console? I'll check what's connected and walk you through going live."_

## Non-negotiable principles

1. **Credential ownership.** Only ever use accounts and credentials the user explicitly provides. Everything runs on the user's OWN Vercel / GitHub / Google Analytics via their OWN authenticated CLIs (`gh`, `vercel`). Never hardcode a secret; never use an account the user didn't give you.
2. **Always require sign-off.** Never deploy or merge the weekly optimizer's PR without the user's explicit approval. Outward-facing actions (deploy, merge, push) are confirmed first.
3. **The numeric `GA4_PROPERTY_ID` ≠ the `G-XXXXXXXXXX` Measurement ID.** Verify which is which before saving.

## Where things live

- Page copy: `content/landing.json` — what the optimizer rewrites.
- Brand + strategy + conversion config: `config/site.config.ts`.
- Conversion targets: `config/targets.config.ts`.
- Weekly optimizer: `optimizer/` + `.github/workflows/optimize.yml`.
- The console playbook: `.claude/skills/landing-console/SKILL.md`.
- Recipient setup: `docs/GIFT-SETUP.md`.
