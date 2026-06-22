import { siteConfig } from "@config/site.config";
import { SITE_URL } from "@/lib/config";

/**
 * /llms.txt — the emerging convention for giving AI assistants a clean, factual
 * brief about a site (improves how accurately they describe + cite you). Generated
 * from config/site.config.ts, so it stays in sync with the strategy the optimizer
 * already reads. Static: depends only on config.
 */
export const dynamic = "force-static";

export function GET() {
  const { business, seo, strategy: s, conversion } = siteConfig;

  const lines = [
    `# ${business.name}`,
    "",
    `> ${seo.defaultDescription}`,
    "",
    "## Offer",
    s.offer,
    "",
    "## Who it's for",
    s.icp,
  ];

  const realProof = s.proof.filter((p) => p && !/placeholder/i.test(p));
  if (realProof.length) {
    lines.push("", "## Proof", ...realProof.map((p) => `- ${p}`));
  }

  lines.push(
    "",
    "## Primary action",
    `Visitors are asked to: ${conversion.primaryGoal}.`,
    "",
    "## Key pages",
    `- [${seo.siteName}](${SITE_URL}/): ${seo.defaultTitle}`,
  );

  const contact: string[] = [];
  if (business.supportEmail) contact.push(`Email: ${business.supportEmail}`);
  if (business.phone) contact.push(`Phone: ${business.phone}`);
  if (contact.length) lines.push("", "## Contact", ...contact);

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
