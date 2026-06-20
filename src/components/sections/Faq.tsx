import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "faq" }>;

export function Faq(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
      </div>
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-line rounded-brand border border-line bg-surface">
        {props.items.map((item, i) => (
          <details key={i} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-ink marker:content-none">
              {item.q}
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-muted transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
