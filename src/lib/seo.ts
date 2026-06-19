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
      // When defaultOgImage is blank, the file-convention images
      // (opengraph-image.tsx / twitter-image.tsx) supply the cards.
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
 * Serializes JSON-LD for safe injection into a <script type="application/ld+json">
 * via dangerouslySetInnerHTML. Escaping `<` (plus `>` and `&`) neutralizes a
 * `</script>` breakout from any content field — so copy or an optimizer rewrite
 * can never inject markup.
 */
export function safeJsonLdString(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Best-effort parse of a displayed price string into a schema.org numeric value. */
function parsePrice(amount: string): string | null {
  const match = amount.match(/[0-9][0-9.,\s]*/);
  if (!match) return null;
  // Bail on scale suffixes ("2.5M", "10k") — expanding them is ambiguous, and a
  // wrong-by-orders-of-magnitude price is worse than omitting the offer.
  const next = amount.charAt((match.index ?? 0) + match[0].length);
  if (/[kKmMbB]/.test(next)) return null;
  // Drop spaces + thousands separators; keep the value numeric.
  const normalized = match[0].replace(/[\s,]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? String(value) : null;
}

/** Validate a configured currency as an ISO-4217-shaped code. */
function isoCurrency(raw: string | undefined): string | null {
  const c = raw?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(c) ? c : null;
}

const ORG_ID = `${SITE_URL}#org`;

/**
 * JSON-LD structured data. This is the single biggest lever for AI search (AISEO)
 * and rich results: it tells crawlers exactly what the org is, what's offered,
 * and answers FAQs in a machine-readable way. Serialize with `safeJsonLdString`.
 */
export function buildJsonLd(content: Content): object[] {
  const graph: object[] = [];

  const orgLogo = siteConfig.brand.logo.src
    ? new URL(siteConfig.brand.logo.src, SITE_URL).toString()
    : undefined;

  graph.push({
    "@context": "https://schema.org",
    "@type": siteConfig.organization.type,
    "@id": ORG_ID,
    name: siteConfig.business.legalName || siteConfig.business.name,
    url: SITE_URL,
    ...(orgLogo ? { logo: orgLogo } : {}),
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
    "@id": `${SITE_URL}#website`,
    name: siteConfig.seo.siteName,
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
  });

  // Offer -> Product/Service structured data, derived from the offer section.
  const offer = content.sections.find((s): s is Extract<Section, { type: "offer" }> =>
    s.type === "offer",
  );
  if (offer) {
    const price = offer.price ? parsePrice(offer.price.amount) : null;
    const currency = isoCurrency(siteConfig.seo.currency);
    graph.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: offer.headline,
      description: offer.subhead || content.meta.description,
      brand: { "@type": "Brand", name: siteConfig.business.name },
      // Only emit a structured Offer when BOTH a numeric price and a valid
      // currency are available — a malformed currency makes the Offer invalid.
      ...(price !== null && currency
        ? {
            offers: {
              "@type": "Offer",
              price,
              priceCurrency: currency,
              availability: "https://schema.org/InStock",
              url: SITE_URL,
            },
          }
        : {}),
      ...(offer.rating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: offer.rating.value,
              ratingCount: offer.rating.count,
              bestRating: 5,
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
