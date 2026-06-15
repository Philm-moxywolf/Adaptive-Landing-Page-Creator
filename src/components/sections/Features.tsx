import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading, Lead, CheckIcon } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "features" }>;

export function Features(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
        {props.subhead && <Lead>{props.subhead}</Lead>}
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {props.items.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-brand border border-line bg-surface p-6"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-brand bg-brand-muted text-brand">
              <CheckIcon />
            </span>
            <div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-ink-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
