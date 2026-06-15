# Content guide

How to write the two files that make the page yours.

---

## `config/site.config.ts`

The brand + business + strategy. The fields are typed and documented inline. The
one block worth extra attention is **`strategy`** — it's both the source of truth
for your positioning *and* the brief the weekly optimizer reads on every run:

```ts
strategy: {
  offer: "One sentence: what you sell and the core promise.",
  icp: "Who it's for and their #1 pain, in your words.",
  objections: ["The doubts that stop people buying", "..."],
  proof: ["Only facts the copy is allowed to cite", "4,000+ teams", "4.8/5"],
  voice: "Tone guardrails — short sentences, no hype, etc.",
  forbiddenClaims: ["Claims the optimizer must NEVER make"],
}
```

The richer and more honest this is, the smarter and safer every rewrite. `proof`
is an allow-list — the optimizer won't invent stats outside it. `forbiddenClaims`
is a hard guardrail (compliance, legal, anything unverifiable).

---

## `content/landing.json`

An ordered list of **sections**. Each has a stable `id`, a `type`, and optional
`enabled` (default `true`). Reorder sections by reordering the array. Hide one by
setting `"enabled": false`. The `id` is what ties analytics together over time —
keep it stable when a section keeps its purpose.

### `meta`

```json
"meta": {
  "title": "Page title (SEO + browser tab)",
  "description": "Meta description (search + social)",
  "keywords": ["optional", "keywords"]
}
```

### Section types

A CTA anywhere is `{ "label": "...", "href": "...", "kind": "primary"|"secondary", "trackingId": "..." }`.
Use `#lead` as an `href` to scroll to the lead form. `trackingId` powers per-CTA
click analytics — keep it stable.

| `type` | Purpose | Key fields |
| --- | --- | --- |
| `hero` | Above-the-fold promise + primary CTA | `headline`, `subhead?`, `bullets[]`, `primaryCta`, `secondaryCta?`, `trust?`, `eyebrow?` |
| `logos` | Social proof bar | `title?`, `logos[]{ name, src? }` |
| `stats` | Headline numbers | `title?`, `items[]{ value, label }` |
| `problem` | Agitate the pain | `headline`, `body?`, `pains[]{ title, body? }` |
| `features` | What it does / value props | `headline`, `subhead?`, `items[]{ title, body }` |
| `howItWorks` | Steps to value | `headline`, `steps[]{ title, body }`, `cta?` |
| `testimonials` | Quotes | `headline`, `items[]{ quote, name, role?, company? }` |
| `offer` | The stack, price, guarantee | `headline`, `subhead?`, `price?`, `includes[]`, `guarantee?`, `urgency?`, `cta` |
| `faq` | Objection handling (also emits FAQ rich results) | `headline`, `items[]{ q, a }` |
| `leadForm` | Capture the lead | `headline`, `fields[]`, `submitLabel`, `successMessage`, `consentText?` |
| `finalCta` | Closing ask | `headline`, `subhead?`, `cta`, `secondaryCta?` |

### Lead form fields

```json
{
  "name": "email",          // form field name (sent to your webhook)
  "label": "Work email",
  "type": "email",          // text | email | tel | textarea | select
  "required": true,
  "placeholder": "you@company.com",
  "autoComplete": "email",
  "options": ["For select fields only"]
}
```

Keep forms short — every field costs conversion. Name + email is usually enough.

### Validation

Run `npm run typecheck` (it validates the schema) or just `npm run dev` — invalid
content fails loudly with the exact path of the problem, so you can't ship a broken
page.

---

## A/B variants (optional)

When `experiment.enabled` is true in `site.config.ts`, you (or the optimizer) can
test a change without shipping it blind. Add an `experiments` block to the content:

```json
"experiments": {
  "B": {
    "label": "Stronger urgency hero",
    "overrides": {
      "hero": { "headline": "An alternative headline tested against the base" }
    }
  }
}
```

Visitors bucketed into variant `B` see the overridden fields merged over the base
section; everyone else sees the base. The `variant` is attached to every analytics
event, so you can compare conversion per arm in GA4 (register the `variant` custom
dimension — see SETUP.md).
