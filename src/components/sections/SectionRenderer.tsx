import type { Section } from "@/lib/content-schema";
import { TrackedSection } from "@/components/tracking/TrackedSection";
import { Hero } from "./Hero";
import { Logos } from "./Logos";
import { Stats } from "./Stats";
import { Problem } from "./Problem";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Testimonials } from "./Testimonials";
import { Offer } from "./Offer";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { LeadForm } from "./LeadForm";

/**
 * Maps a content section to its component and wraps it in a tracked <section>.
 * Adding a new section type means: extend the schema, add a component, add a case.
 */
export function SectionRenderer({
  section,
  conversionEventName,
}: {
  section: Section;
  conversionEventName: string;
}) {
  const label = "headline" in section ? section.headline : section.type;

  let inner: React.ReactNode = null;
  switch (section.type) {
    case "hero":
      inner = <Hero {...section} />;
      break;
    case "logos":
      inner = <Logos {...section} />;
      break;
    case "stats":
      inner = <Stats {...section} />;
      break;
    case "problem":
      inner = <Problem {...section} />;
      break;
    case "features":
      inner = <Features {...section} />;
      break;
    case "howItWorks":
      inner = <HowItWorks {...section} />;
      break;
    case "testimonials":
      inner = <Testimonials {...section} />;
      break;
    case "offer":
      inner = <Offer {...section} />;
      break;
    case "faq":
      inner = <Faq {...section} />;
      break;
    case "finalCta":
      inner = <FinalCta {...section} />;
      break;
    case "leadForm":
      inner = <LeadForm {...section} conversionEventName={conversionEventName} />;
      break;
  }

  return (
    <TrackedSection id={section.id} sectionType={section.type} ariaLabel={label}>
      {inner}
    </TrackedSection>
  );
}
