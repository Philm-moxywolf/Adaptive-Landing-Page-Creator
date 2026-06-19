import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getContent, enabledSections } from "@/lib/content";
import { buildMetadata, buildJsonLd, safeJsonLdString } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { VARIANT_COOKIE } from "@/lib/analytics";
import { SectionRenderer } from "@/components/sections/SectionRenderer";

// Metadata is variant-independent so crawlers always see a stable title/description.
export function generateMetadata(): Metadata {
  return buildMetadata(getContent());
}

export default async function Page() {
  const variant = siteConfig.experiment.enabled
    ? (await cookies()).get(VARIANT_COOKIE)?.value
    : undefined;
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const content = getContent(variant);
  const sections = enabledSections(content);
  const jsonLd = buildJsonLd(content);

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
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
