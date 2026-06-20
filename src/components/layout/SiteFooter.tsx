import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const socials = Object.entries(siteConfig.social).filter(([, v]) => v);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-lp flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
        <p className="text-sm text-ink-muted">
          © {year} {siteConfig.business.legalName || siteConfig.business.name}.
          All rights reserved.
        </p>
        {socials.length > 0 && (
          <ul className="flex gap-5 text-sm">
            {socials.map(([name, href]) => (
              <li key={name}>
                <a
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="capitalize text-ink-muted hover:text-ink"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
