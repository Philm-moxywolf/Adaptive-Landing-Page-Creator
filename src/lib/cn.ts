/** Tiny classname joiner — filters falsy values. Avoids a clsx dependency. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

/** Shared CTA button styling, by emphasis. */
export function ctaClasses(kind: "primary" | "secondary" = "primary"): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-brand px-6 py-3 text-base font-semibold transition-opacity transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand";
  if (kind === "secondary") {
    return cn(
      base,
      "border border-line bg-transparent text-ink hover:bg-surface",
    );
  }
  return cn(base, "bg-brand text-brand-fg shadow-sm hover:opacity-90");
}

/** Slugify a label into a stable tracking id fallback. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
