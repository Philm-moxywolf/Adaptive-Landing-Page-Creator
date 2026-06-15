import type { Metadata } from "next";
import { siteConfig, SITE_URL } from "./config";
import type { Content, Section } from "./content-schema";

/**
 * Builds Next.js <head> metadata from brand config + page content. Covers the
 * classic SEO surface (title/description/canonical) AND the social/AISEO surface
 * (OpenGraph, Twitter card) that paid social and AI crawlers consume.
 */
export function buildMetadata(content: Content): Metadata {
  const title = content.meta.title || siteConfig.seo.defaultTitle;
  const description = content.meta.description || siteConfig.seo.defaultDescription;
  const ogImage = siteConfig.seo.defaultOgImage
    ? new URL(siteConfig.seo.defaultOgImage, SITE_URL).toString()
    : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: siteConfig.seo.titleTemplate,
    },
    description,
    keywords: content.meta.keywords,
    applicationName: siteConfig.seo.siteName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.seo.siteName,
      title,
      description,
      url: SITE_URL,
      locale: siteConfig.seo.locale,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: content.meta.ogImageAlt || title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: siteConfig.seo.twitterHandle,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

/**
 * JSON-LD structured data. This is the single biggest lever for AI search (AISEO)
 * and rich results: it tells crawlers exactly what the org is, what's offered,
 * and answers FAQs in a machine-readable way. Rendered as <script type="ld+json">.
 */
export function buildJsonLd(content: Content): object[] {
  const graph: object[] = [];

  graph.push({
    "@context": "https://schema.org",
    "@type": siteConfig.organization.type,
    name: siteConfig.business.legalName || siteConfig.business.name,
    url: SITE_URL,
    ...(siteConfig.seo.defaultOgImage
      ? { logo: new URL(siteConfig.seo.defaultOgImage, SITE_URL).toString() }
      : {}),
    ...(siteConfig.business.supportEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            email: siteConfig.business.supportEmail,
            contactType: "customer support",
          },
        }
      : {}),
    sameAs: siteConfig.organization.sameAs,
  });

  graph.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.seo.siteName,
    url: SITE_URL,
  });

  // Offer -> Product/Service structured data, derived from the offer section.
  const offer = content.sections.find((s): s is Extract<Section, { type: "offer" }> =>
    s.type === "offer",
  );
  if (offer) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: offer.headline,
      description: offer.subhead || content.meta.description,
      brand: { "@type": "Brand", name: siteConfig.business.name },
      ...(offer.price
        ? {
            offers: {
              "@type": "Offer",
              price: offer.price.amount.replace(/[^0-9.]/g, "") || "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              url: SITE_URL,
            },
          }
        : {}),
    });
  }

  // FAQ -> FAQPage, the highest-yield rich result for landing pages.
  const faq = content.sections.find((s): s is Extract<Section, { type: "faq" }> =>
    s.type === "faq",
  );
  if (faq) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return graph;
}
