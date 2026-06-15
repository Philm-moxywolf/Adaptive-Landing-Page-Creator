import { z } from "zod";

/**
 * The landing-page content contract.
 *
 * `content/landing.json` must satisfy this schema, and so must every rewrite the
 * weekly optimizer produces. Validation happens before render AND before the
 * optimizer is allowed to write a file — so a malformed AI output can never reach
 * production. To give the optimizer a new lever, add a section type here and a
 * matching component in src/components/sections.
 */

export const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  kind: z.enum(["primary", "secondary"]).default("primary"),
  /** Stable id used for click tracking; defaults to a slug of the label. */
  trackingId: z.string().optional(),
  ariaLabel: z.string().optional(),
});
export type Cta = z.infer<typeof ctaSchema>;

export const mediaSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string().min(1),
  alt: z.string().default(""),
  poster: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const withBase = <T extends z.ZodRawShape>(shape: T) =>
  z.object({
    id: z.string().min(1),
    enabled: z.boolean().default(true),
    ...shape,
  });

const heroSection = withBase({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
  media: mediaSchema.optional(),
  /** Trust line under the CTA, e.g. "No credit card · 2-min setup". */
  trust: z.string().optional(),
});

const logosSection = withBase({
  type: z.literal("logos"),
  title: z.string().optional(),
  logos: z
    .array(z.object({ name: z.string(), src: z.string().optional() }))
    .default([]),
});

const statsSection = withBase({
  type: z.literal("stats"),
  title: z.string().optional(),
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(1),
});

const problemSection = withBase({
  type: z.literal("problem"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  body: z.string().optional(),
  pains: z
    .array(z.object({ title: z.string(), body: z.string().optional() }))
    .min(1),
});

const featuresSection = withBase({
  type: z.literal("features"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        icon: z.string().optional(),
      }),
    )
    .min(1),
});

const howItWorksSection = withBase({
  type: z.literal("howItWorks"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  steps: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  cta: ctaSchema.optional(),
});

const testimonialsSection = withBase({
  type: z.literal("testimonials"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
        role: z.string().optional(),
        company: z.string().optional(),
        avatar: z.string().optional(),
      }),
    )
    .min(1),
});

const offerSection = withBase({
  type: z.literal("offer"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  price: z
    .object({
      amount: z.string(),
      period: z.string().optional(),
      compareAt: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
  includes: z
    .array(z.object({ title: z.string(), body: z.string().optional() }))
    .min(1),
  guarantee: z
    .object({ title: z.string(), body: z.string() })
    .optional(),
  urgency: z.string().optional(),
  cta: ctaSchema,
});

const faqSection = withBase({
  type: z.literal("faq"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  items: z.array(z.object({ q: z.string(), a: z.string() })).min(1),
});

const finalCtaSection = withBase({
  type: z.literal("finalCta"),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  cta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
});

const fieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["text", "email", "tel", "textarea", "select"]).default("text"),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  autoComplete: z.string().optional(),
});

const leadFormSection = withBase({
  type: z.literal("leadForm"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  submitLabel: z.string().default("Get started"),
  successMessage: z.string().default("Thanks — we'll be in touch shortly."),
  consentText: z.string().optional(),
});

export const sectionSchema = z.discriminatedUnion("type", [
  heroSection,
  logosSection,
  statsSection,
  problemSection,
  featuresSection,
  howItWorksSection,
  testimonialsSection,
  offerSection,
  faqSection,
  finalCtaSection,
  leadFormSection,
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];

export const contentSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    keywords: z.array(z.string()).default([]),
    ogImageAlt: z.string().optional(),
  }),
  sections: z.array(sectionSchema).min(1),
  /**
   * Optional per-variant overrides keyed by variant id (e.g. "B"). Each override
   * is a partial section keyed by section id; the renderer deep-merges it over the
   * base section for visitors bucketed into that variant. The optimizer populates
   * this when it wants to A/B test a change rather than ship it blind.
   */
  experiments: z
    .record(
      z.object({
        label: z.string().optional(),
        overrides: z.record(z.record(z.any())),
      }),
    )
    .optional(),
  /** Optimizer bookkeeping — not rendered. */
  _meta: z
    .object({
      version: z.number().default(1),
      lastOptimizedAt: z.string().optional(),
      changelog: z.array(z.string()).default([]),
    })
    .optional(),
});

export type Content = z.infer<typeof contentSchema>;

export function parseContent(data: unknown): Content {
  return contentSchema.parse(data);
}

export function safeParseContent(data: unknown) {
  return contentSchema.safeParse(data);
}
