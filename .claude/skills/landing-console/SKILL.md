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

Run these to learn what's already done, then reflect it in the console. Don't change anything yet.

```bash
gh auth status                 # is GitHub CLI authed?
git remote -v                  # is there an origin, and is it the user's own repo?
gh repo view --json nameWithOwner,visibility 2>/dev/null
gh secret list 2>/dev/null     # are ANTHROPIC_API_KEY / GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_JSON set?
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
1. `gh auth status` — if not authed, guide `gh auth login`.
2. Make sure the repo is the user's OWN (not the template). If `origin` points at someone else's repo, create theirs and push:
   `gh repo create <their-name> --private --source=. --remote=origin --push`
   (or, from a template repo: `gh repo create <their-name> --template <owner/repo> --private --clone`).
3. Enable Actions to open PRs (off by default — the weekly optimizer needs it):
   `gh api -X PUT repos/{owner}/{repo}/actions/permissions/workflow -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true`
4. Set the optimizer's GitHub Actions secrets from values the user pastes:
   - `gh secret set ANTHROPIC_API_KEY` (their Anthropic API key — this is the one with a per-run token cost)
   - `gh secret set GA4_PROPERTY_ID` (NUMERIC property id)
   - `gh secret set GA4_SERVICE_ACCOUNT_JSON < path/to/key.json` (the whole JSON blob)
   Confirm with `gh secret list`. These power the weekly run; without them it degrades to "report only".

### Connect Vercel
The weekly job needs NO Vercel credential — merging a PR auto-deploys via Git. So "connect" = link the repo once. Easiest routes:
- **Deploy button / dashboard import:** point them at the "Deploy to Vercel" button in `README.md` (one click: clones into their GitHub, creates the project, prompts for env vars, first deploy, and wires auto-deploy-on-push). Repo must be PUBLIC for the clone flow.
- **Or via CLI** (if `vercel` is installed and they're logged in): `vercel link`, then set the runtime env vars and deploy:
  - `vercel env add NEXT_PUBLIC_SITE_URL production` (their domain or the *.vercel.app URL)
  - `vercel env add NEXT_PUBLIC_GA4_MEASUREMENT_ID production` (the `G-XXXX` id)
  - optionally `GA4_MEASUREMENT_PROTOCOL_SECRET`, `LEAD_WEBHOOK_URL`
  - `vercel --prod`
Confirm the repo is Git-connected so every push auto-deploys.

> Note the split: front-end values (`NEXT_PUBLIC_*`, webhook) are **Vercel env vars**; the optimizer's secrets are **GitHub Actions secrets**. Put each in the right place.

### Connect Google Analytics
Two pieces:
1. **Measurement ID** (`G-XXXXXXXXXX`): guide them to create a GA4 property + web data stream (GA4 → Admin → Data Streams). Save the id as the Vercel env var `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. Have them mark the conversion (`generate_lead`) as a Key event, and ideally register `variant` and `percent` custom dimensions.
2. **Read access for the optimizer** (the one ~5-minute manual step — be patient and walk it line by line):
   - In Google Cloud: create/select a project → enable the **Google Analytics Data API** → create a **service account** → create a JSON key, download it.
   - In GA4 → Admin → Property Access Management: add the service-account email (`...@...iam.gserviceaccount.com`) as **Viewer**.
   - Save `GA4_PROPERTY_ID` (numeric) and `GA4_SERVICE_ACCOUNT_JSON` as **GitHub Actions secrets** (see Connect GitHub step 4).

### Deploy (go live)
1. Verify GitHub + Vercel are connected and `NEXT_PUBLIC_SITE_URL` is set (a production build throws if it still resolves to `example.com`).
2. Confirm with the user, then push to the deploy branch (usually `main`). Vercel auto-builds and deploys.
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
