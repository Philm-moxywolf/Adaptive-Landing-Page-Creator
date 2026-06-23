---
name: landing-console
description: Set up, deploy, and run the self-optimizing landing page in this repo. Use when the user wants to launch/set up the landing page, connect GitHub/Vercel/Google Analytics, deploy or go live, or review and approve (sign off on) the weekly optimizer's proposed changes. Renders an in-chat control console and drives everything via the user's own gh/vercel CLIs.
---

# Landing Page Console

You are the operator console for this self-optimizing landing page. Everything runs in the user's OWN Claude Code, on the user's OWN accounts. Your job: render a control panel, detect current state, and drive three things — **connect → deploy → weekly sign-off** — using the user's own authenticated CLIs.

## Principles (do not violate)

- **Credential ownership.** Only use accounts/keys the user explicitly provides. Use their own `gh` and `vercel` CLIs. Set secrets from values THEY supply. Never hardcode a secret; never use an account they didn't give you.
- **Always require sign-off.** Confirm before any deploy, `git push` to a live branch, or `gh pr merge`. Never merge the weekly optimizer PR without explicit approval.
- **`GA4_PROPERTY_ID` is the NUMERIC id** (GA4 Admin → Property Settings), NOT the `G-XXXXXXXXXX` Measurement ID. Verify before saving.

## Step 1 — Detect state (read-only)

FIRST check which tools exist — never assume `gh` or `vercel` are installed:

```bash
command -v gh || echo "gh: NOT installed"
command -v vercel || echo "vercel: NOT installed"
```

If `gh` is missing, don't treat it as an error: tell the user it's optional, and offer to either install it (`brew install gh` on macOS, then `gh auth login`) or do the GitHub steps in the browser (web links are given in each action below). Same for `vercel` — every step has a one-click web alternative.

Then learn what's already done (skip the `gh`/`vercel` lines if those tools are absent):

```bash
gh auth status                 # is GitHub CLI authed?
git remote -v                  # is there an origin, and is it the user's own repo?
gh repo view --json nameWithOwner,visibility 2>/dev/null
gh secret list 2>/dev/null     # ANTHROPIC_API_KEY / GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_JSON set?
test -f .vercel/project.json && echo "vercel: linked" || echo "vercel: not linked"
```

Also peek at config to see if it's still the example: read `config/site.config.ts` (is `business.domain` still a placeholder?) and note whether `NEXT_PUBLIC_SITE_URL` / GA id are set (Vercel env, asked from the user).

## Step 2 — Render the console

**If the `show_widget` tool (visualize MCP) is available:** read `.claude/skills/landing-console/console.html`, update the three connection pills + the deploy state + the weekly card to match what Step 1 found (connected = green check; not = a Connect button), and render it with `show_widget`. The buttons call `sendPrompt(...)`, which routes back here.

**If `show_widget` is NOT available:** present the same thing as a short numbered text menu:

```
Landing Page Console — what would you like to do?
  1) Connect GitHub        [<status>]
  2) Connect Vercel        [<status>]
  3) Connect Google Analytics [<status>]
  4) Deploy (go live)
  5) Review this week's proposed edits
```

Either way, then do whatever the user picks.

## Actions

### Connect GitHub
**No `gh`?** Do this in the browser instead: fork via GitHub "Use this template", add secrets at repo → Settings → Secrets and variables → Actions → New repository secret, and tick repo → Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests". Same result as the commands below.

1. `gh auth status` — if not authed, guide `gh auth login`.
2. Make sure the repo is the user's OWN (not the template). If `origin` points at someone else's repo and the user is already inside a working copy, create theirs in place (this keeps their local edits):
   `gh repo create <their-name> --public --source=. --remote=origin --push`
   Use `--public` so the one-click Vercel deploy can clone it. (If they don't have a local copy yet, have them use GitHub "Use this template" in the browser — do NOT `--clone` into a new directory and strand their current copy.)
3. Enable Actions to open PRs (off by default — the weekly optimizer needs it):
   `gh api -X PUT repos/{owner}/{repo}/actions/permissions/workflow -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true`
4. Set the optimizer's GitHub Actions secrets from values the user pastes. Pipe each value so `gh` doesn't block on an interactive prompt:
   - `printf %s '<their Anthropic key>' | gh secret set ANTHROPIC_API_KEY`
   - `printf %s '<numeric property id>' | gh secret set GA4_PROPERTY_ID`
   - `gh secret set GA4_SERVICE_ACCOUNT_JSON < path/to/key.json` (the whole JSON file)
   Confirm with `gh secret list`. Without these the weekly run degrades to "report only".

### Connect Vercel
The weekly job needs NO Vercel credential — merging a PR auto-deploys via Git. So "connect" = link the user's OWN repo once.
- **Preferred** (when the `vercel` CLI is available and the user is in their repo): `vercel link` (links *this* repo — works whether public or private), then set the runtime env vars and deploy:
  - `vercel env add NEXT_PUBLIC_SITE_URL production` (their real `*.vercel.app` URL or custom domain — not a placeholder)
  - `vercel env add NEXT_PUBLIC_GA4_MEASUREMENT_ID production` (the `G-XXXX` id)
  - optionally `GA4_MEASUREMENT_PROTOCOL_SECRET`, `LEAD_WEBHOOK_URL`
  - `vercel --prod`
- **No `vercel` CLI?** Have them import THEIR repo at vercel.com → **Add New → Project → Import** → pick their repo, and set the same env vars in the import form. (Don't send them to the one-click clone button here — that clones the template into a *separate* repo, not the one they're working in.)
Confirm the repo is Git-connected so every push auto-deploys.

> Note the split: front-end values (`NEXT_PUBLIC_*`, webhook) are **Vercel env vars**; the optimizer's secrets are **GitHub Actions secrets**. Put each in the right place.

### Connect Google Analytics
Two pieces:
1. **Measurement ID** (`G-XXXXXXXXXX`): guide them to create a GA4 property + web data stream (GA4 → Admin → Data Streams). Save the id as the Vercel env var `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. Have them mark the conversion (`generate_lead`) as a Key event, and ideally register `variant` and `percent` custom dimensions.
2. **Read access for the optimizer** (the one ~5-minute manual step — be patient and walk it line by line):
   - In Google Cloud: create/select a project → enable the **Google Analytics Data API** → create a **service account** → create a JSON key, download it.
   - In GA4 → Admin → Property Access Management: add the service-account email (`...@...iam.gserviceaccount.com`) as **Viewer**.
   - Save `GA4_PROPERTY_ID` (numeric) and `GA4_SERVICE_ACCOUNT_JSON` as **GitHub Actions secrets** (see Connect GitHub step 4).

### Connect optional signals (PostHog · Search Console) — only if the user asks
All optional; the page + weekly optimizer work on GA4 alone, and each source auto-detects (connected → used, absent → skipped). Offer these as a "want even richer data?" follow-up, never as a blocker to going live.
- **PostHog** (session replay + product analytics): free project at posthog.com → save the **Project API key** (`phc_…`, public) as Vercel env `NEXT_PUBLIC_POSTHOG_KEY` and the region as `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.posthog.com` or `…eu…`). To let the optimizer read it, set GitHub **secret** `POSTHOG_PERSONAL_API_KEY` (a Personal API key, scope Query Read) + GitHub **variables** `POSTHOG_PROJECT_ID` and `POSTHOG_HOST` (the **app** host — note **no** `.i.`). Use `gh variable set` for the non-secret ones.
- **Google Search Console** (free SEO signal): reuses the SAME GA4 service account — just add that service-account email to the GSC property (Settings → Users and permissions), then set GitHub **variable** `GSC_SITE_URL` (`sc-domain:domain.com` or `https://domain.com/`).
- **AIEO** needs nothing extra: `/llms.txt`, the AI-crawler robots policy (`seo.aiCrawlerPolicy`), and AI-referral/crawler events are already live (crawler events reuse `GA4_MEASUREMENT_PROTOCOL_SECRET`).
- Same split as always: `NEXT_PUBLIC_*` + the PostHog public key are **Vercel env vars**; the PostHog personal key is a **GitHub secret**; project id / host / GSC URL are **GitHub variables**.

### Deploy (go live)
1. Verify GitHub + Vercel are connected and `NEXT_PUBLIC_SITE_URL` is set to the real URL (a production build throws if it still resolves to `example.com`).
2. Find Vercel's PRODUCTION branch (usually `main`) and the current branch (`git branch --show-current`). Vercel deploys production from the production branch only — do NOT push the current feature branch to production. If the user isn't on the production branch, get explicit sign-off, then merge into it (e.g. open + merge a PR into `main`) — that triggers the deploy.
3. Report the live URL. Offer to open it.

### Weekly sign-off
The GitHub Action runs every Saturday: pulls GA4 → rewrites the page → opens a PR. To review:
1. `gh pr list --label optimizer --state open` → find the latest optimizer PR.
2. Show the change: `gh pr diff <n>` (summarize the copy/section changes), and surface the rationale + changelog from the workflow's **optimizer-report** artifact and `content._meta.changelog`.
3. Ask the user to approve or skip:
   - **Approve & publish:** confirm, then `gh pr merge <n> --squash` → Vercel auto-deploys the new page.
   - **Skip:** `gh pr close <n>` (this week's rewrite is discarded; next Saturday tries again).
4. Never merge without explicit approval.

## On-demand optimize
If the user wants to optimize now instead of waiting for Saturday: run `npm run optimize:dry` to preview (needs `ANTHROPIC_API_KEY`; uses GA4 if creds are set, else cold-start), or trigger the Action manually (`gh workflow run "Weekly conversion optimizer"`). Then run the weekly sign-off flow on the resulting PR.
