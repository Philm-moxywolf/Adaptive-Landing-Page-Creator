import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading, Lead } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "problem" }>;

export function Problem(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
        {props.body && <Lead>{props.body}</Lead>}
      </div>
      <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {props.pains.map((pain, i) => (
          <li
            key={i}
            className="rounded-brand border border-line bg-surface p-6"
          >
            <h3 className="text-lg font-semibold">{pain.title}</h3>
            {pain.body && (
              <p className="mt-2 text-ink-muted">{pain.body}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
