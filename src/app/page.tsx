import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getContent, enabledSections } from "@/lib/content";
import { buildMetadata, buildJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { VARIANT_COOKIE } from "@/lib/analytics";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

// Metadata is variant-independent so crawlers always see a stable title/description.
export function generateMetadata(): Metadata {
  return buildMetadata(getContent());
}

export default async function Page() {
  const cookieStore = await cookies();
  const variant = cookieStore.get(VARIANT_COOKIE)?.value;
  const content = getContent(variant);
  const sections = enabledSections(content);
  const jsonLd = buildJsonLd(content);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          conversionEventName={siteConfig.conversion.conversionEventName}
        />
      ))}
    </>
  );
}
