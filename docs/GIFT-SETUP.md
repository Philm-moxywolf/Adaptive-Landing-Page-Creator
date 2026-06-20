# Setup — you received this landing page

This is a **self-optimizing landing page** you run yourself, in your own Claude Code, on your own accounts. There's no service to sign up for and nothing routes through anyone else — you own all of it.

You drive the whole thing from a **console inside Claude Code**: connect your accounts, deploy, and each week approve the changes the optimizer proposes. You never have to touch the code.

---

## What you'll need

- **Claude Code** (where you'll run the console)
- A **GitHub** account (the `gh` CLI signed in — Claude will help)
- A **Vercel** account (free tier is fine) — hosting
- A **Google Analytics 4** property — measurement
- An **Anthropic API key** — powers the weekly AI rewrite *(this is the one ongoing cost: roughly one model run per week)*
- A **domain** (optional)

---

## The 60-second version

1. **Get your own copy.** Create your own repository from this one (GitHub "Use this template", or ask Claude: _"make this my own repo and push it"_).
2. **Open it in Claude Code** and say: **_"set up my landing page."_**
3. The **console** appears. Click through it:
   - **Connect GitHub** → Claude uses your `gh` CLI to wire your repo + store the optimizer's secrets.
   - **Connect Vercel** → one click links your repo so every change auto-deploys.
   - **Connect Google Analytics** → add your Measurement ID + grant the optimizer read access.
   - **Deploy** → you're live.
4. **Every Saturday**, the optimizer proposes edits. Open the console, review them, and click **Approve** (or **Skip**). Nothing goes live without you.

That's it. Steps 1–3 are a one-time ~15–30 minutes (the Google Analytics service-account step is the only fiddly bit — Claude walks you through it). After that it's ~2 minutes a week.

---

## Make it yours (optional, anytime)

Tell Claude your offer and it rewrites the page for you — or edit two files directly:

- `config/site.config.ts` — your brand (colors, fonts, name), domain, conversion goal, and your **strategy brief** (offer, ICP, objections, proof, voice). The richer the strategy, the smarter every weekly rewrite.
- `content/landing.json` — the page copy itself.

Set your goals in `config/targets.config.ts`, then the weekly optimizer pushes every metric past its target.

---

## Good to know

- **Your secrets stay yours.** Front-end values live as Vercel env vars; the optimizer's secrets live as GitHub Actions secrets in *your* repo. Nothing is shared.
- **`NEXT_PUBLIC_SITE_URL` is required in production** — the build deliberately fails if it's left as the placeholder, so you can't accidentally ship a half-configured page.
- **The weekly AI is optional.** The page works and tracks with just Vercel + a GA4 Measurement ID. Add the Anthropic key + GA service account only when you want the weekly optimization (and its small cost) to start.
- **Complete click-by-click walkthrough:** [docs/GO-LIVE.md](GO-LIVE.md) — every step with diagrams, written so anyone can follow it.
- **Full reference:** `docs/SETUP.md` (every field/step), `docs/OPTIMIZER.md` (the weekly loop), `docs/CONTENT_GUIDE.md` (writing copy), `docs/ARCHITECTURE.md` (how it fits together).
