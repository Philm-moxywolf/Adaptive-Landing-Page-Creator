import rawContent from "@content/landing.json";
import {
  parseContent,
  sectionSchema,
  type Content,
  type Section,
} from "./content-schema";

/**
 * Loads and validates the landing-page content, applying per-variant overrides.
 * Validation runs once and is cached. If the JSON is ever invalid (e.g. a bad
 * optimizer write slipped through), this throws at build/render time — failing
 * loud rather than shipping a broken page.
 */
let cached: Content | null = null;

function baseContent(): Content {
  if (!cached) cached = parseContent(rawContent);
  return cached;
}

export function getContent(variant?: string): Content {
  const content = baseContent();
  const experiment = variant ? content.experiments?.[variant] : undefined;
  if (!experiment) return content;

  const overrides = experiment.overrides || {};
  const sections = content.sections.map((section) => {
    const override = overrides[section.id];
    if (!override) return section;
    // Overrides are typed loosely (z.any()). Never let one change a section's
    // identity/discriminant, and re-validate the shallow merge — a bad override
    // falls back to the safe base rather than blanking or breaking the render.
    const { id: _id, type: _type, ...safe } = override as Record<string, unknown>;
    const merged = sectionSchema.safeParse({ ...section, ...safe });
    return merged.success ? merged.data : section;
  });
  return { ...content, sections };
}

/** Sections that should actually render, in order. */
export function enabledSections(content: Content): Section[] {
  return content.sections.filter((s) => s.enabled !== false);
}
