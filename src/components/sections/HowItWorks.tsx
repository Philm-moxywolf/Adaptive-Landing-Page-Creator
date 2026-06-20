import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading } from "@/components/ui/Primitives";
import { TrackedCTA } from "@/components/tracking/TrackedCTA";

type Props = Extract<Section, { type: "howItWorks" }>;

export function HowItWorks(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
      </div>
      <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {props.steps.map((step, i) => (
          <li
            key={i}
            className="relative rounded-brand border border-line bg-surface p-6"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg"
            >
              {i + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      {props.cta && (
        <div className="mt-10 text-center">
          <TrackedCTA cta={props.cta} location="how_it_works" />
        </div>
      )}
    </div>
  );
}
