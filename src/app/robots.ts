import type { MetadataRoute } from "next";
import { SITE_URL, siteConfig } from "@/lib/config";
import { AI_SEARCH_BOTS, AI_TRAINING_BOTS } from "@/lib/ai-sources";

/**
 * robots.txt with a configurable AI-crawler policy (seo.aiCrawlerPolicy).
 * Default "allow" maximizes AI-answer visibility; "search-only" keeps the page in
 * AI search results while opting out of training-only crawlers; "block" excludes
 * all known AI crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const policy = siteConfig.seo.aiCrawlerPolicy ?? "allow";

  type RobotRule = {
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
  };
  const rules: RobotRule[] = [{ userAgent: "*", allow: "/" }];
  if (policy === "search-only") {
    // Search bots stay allowed under "*"; opt out of the training-only crawlers.
    rules.push({ userAgent: AI_TRAINING_BOTS, disallow: "/" });
  } else if (policy === "block") {
    rules.push({ userAgent: [...AI_TRAINING_BOTS, ...AI_SEARCH_BOTS], disallow: "/" });
  }

  // `host` is intentionally omitted — Google ignores it and it can mislead.
  return { rules, sitemap: `${SITE_URL}/sitemap.xml` };
}
