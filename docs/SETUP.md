# Setup guide

Going from a fresh clone to a live, self-optimizing landing page. Plan ~30–45 min
the first time. Every step that needs an account is called out.

---

## 0. Prerequisites

- Node.js 20+ and npm
- A GitHub account (the repo is already on GitHub)
- A Vercel account (free tier is fine) — https://vercel.com
- A Google Analytics 4 property — https://analytics.google.com
- An Anthropic API key — https://console.anthropic.com
- A domain (optional but recommended)

---

## 1. Install and run locally

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

You'll see the example page. Leave env values blank for now — analytics simply
won't load locally, which keeps dev clean.

---

## 2. Make it yours

Edit **two files** (see [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for the full reference):

1. **`config/site.config.ts`** — business name, domain, brand colors/fonts, conversion
   goal + CTA destination, and the **`strategy`** block (offer, ICP, objections, proof,
   voice, forbidden claims). The strategy block is the fuel the weekly optimizer runs on —
   the richer it is, the smarter every rewrite.
2. **`content/landing.json`** — your headline, sections, offer, FAQ, and lead form.

Set your conversion targets in **`config/targets.config.ts`**.

Re-run `npm run dev` and iterate until the page looks right.

---

## 3. Create your GA4 property + Measurement ID

1. GA4 → **Admin → Data Streams → Web** → create a stream for your domain.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Put it in `.env.local`:
   ```
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
4. **Mark your conversion as a key event.** GA4 → Admin → **Key events** → mark
   `generate_lead` (or whatever you set as `conversion.conversionEventName`).
5. *(Recommended)* **Register custom dimensions** so the optimizer can slice by
   experiment and scroll depth. GA4 → Admin → **Custom definitions → Create custom dimension**:
   - `variant` — event-scoped, parameter `variant`
   - `percent` — event-scoped, parameter `percent`

### Server-side conversion tracking (optional but recommended)

So conversions count even when the browser tag is blocked:

1. GA4 → Admin → Data Streams → your stream → **Measurement Protocol API secrets** → create one.
2. Add to env: `GA4_MEASUREMENT_PROTOCOL_SECRET=...`

---

## 4. Deploy to Vercel

1. https://vercel.com → **Add New → Project** → import
   `Adaptive-Landing-Page-Creator` from GitHub.
2. Framework preset: **Next.js** (auto-detected). No build settings to change.
3. **Environment Variables** — add the public ones at minimum:
   - `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
   - `NEXT_PUBLIC_SITE_URL`
   - `GA4_MEASUREMENT_PROTOCOL_SECRET` (if using server-side conversions)
   - `LEAD_WEBHOOK_URL` (if forwarding leads to a CRM/Zapier/Make)
4. **Deploy.** Then **Settings → Domains** → add your domain and follow the DNS steps.

Vercel will now auto-deploy every push to `main`, and build a **preview** for every
PR — which is exactly how you'll review the weekly optimizer's changes.

---

## 5. Wire up the weekly optimizer

The optimizer runs in GitHub Actions (already committed at
`.github/workflows/optimize.yml`). It needs three secrets.

### 5a. Create a Google service account for GA4 read access

1. https://console.cloud.google.com → create/select a project.
2. **APIs & Services → Enable APIs** → enable **Google Analytics Data API**.
3. **IAM & Admin → Service Accounts → Create** → create one → **Keys → Add key → JSON**. Download it.
4. In GA4 → **Admin → Property Access Management** → add the service-account email
   (`...@...iam.gserviceaccount.com`) with the **Viewer** role.

### 5b. Add GitHub secrets

In the GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `GA4_PROPERTY_ID` | The numeric Property ID (GA4 → Admin → Property Settings — **not** the `G-` id) |
| `GA4_SERVICE_ACCOUNT_JSON` | Paste the **entire** JSON key file contents |

*(Optional)* Under **Variables**, set `OPTIMIZER_MODEL` to override the default
(`claude-opus-4-8`).

### 5c. Test it

GitHub → **Actions → Weekly conversion optimizer → Run workflow** → tick **dry run**.
Watch the logs and download the **optimizer-report** artifact. When you're happy,
run it without dry-run (or just wait for Saturday) and it'll open a PR.

---

## 6. Hand-off checklist (per client)

- [ ] `config/site.config.ts` filled in (brand + strategy)
- [ ] `content/landing.json` written
- [ ] `config/targets.config.ts` targets set from their baseline
- [ ] GA4 property + Measurement ID + key event + custom dimensions
- [ ] Vercel project + env vars + custom domain
- [ ] GitHub secrets for the optimizer
- [ ] Dry-run the optimizer once and review the report

Done — the page is live, fully tracked, and improving itself every week.
