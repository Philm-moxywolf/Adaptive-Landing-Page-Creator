import type { Section } from "@/lib/content-schema";
import { SectionHeading } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "stats" }>;

export function Stats(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-20">
      {props.title && (
        <SectionHeading className="text-center">{props.title}</SectionHeading>
      )}
      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {props.items.map((item, i) => (
          <div
            key={i}
            className="rounded-brand border border-line bg-surface p-8 text-center"
          >
            <dt className="text-4xl font-extrabold text-brand sm:text-5xl">
              {item.value}
            </dt>
            <dd className="mt-2 text-ink-muted">{item.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
