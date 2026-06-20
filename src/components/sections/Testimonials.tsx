import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "testimonials" }>;

export function Testimonials(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {props.items.map((t, i) => (
          <figure
            key={i}
            className="flex flex-col justify-between rounded-brand border border-line bg-surface p-8"
          >
            <blockquote className="text-lg leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-sm font-bold text-brand"
              >
                {t.name.charAt(0)}
              </span>
              <span className="text-sm">
                <span className="font-semibold text-ink">{t.name}</span>
                {(t.role || t.company) && (
                  <span className="block text-ink-muted">
                    {[t.role, t.company].filter(Boolean).join(", ")}
                  </span>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
