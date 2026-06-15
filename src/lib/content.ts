import rawContent from "@content/landing.json";
import { parseContent, type Content, type Section } from "./content-schema";

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
    return override ? ({ ...section, ...override } as Section) : section;
  });
  return { ...content, sections };
}

/** Sections that should actually render, in order. */
export function enabledSections(content: Content): Section[] {
  return content.sections.filter((s) => s.enabled !== false);
}
