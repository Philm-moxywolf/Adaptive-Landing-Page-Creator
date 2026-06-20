import type { Section } from "@/lib/content-schema";
import { TrackedCTA } from "@/components/tracking/TrackedCTA";
import { CheckIcon } from "@/components/ui/Primitives";

type Props = Extract<Section, { type: "hero" }>;

export function Hero(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        {props.eyebrow && (
          <p className="mb-5 inline-block rounded-full bg-brand-muted px-4 py-1.5 text-sm font-medium text-brand">
            {props.eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
          {props.headline}
        </h1>
        {props.subhead && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted sm:text-xl">
            {props.subhead}
          </p>
        )}

        {props.bullets.length > 0 && (
          <ul className="mx-auto mt-8 flex max-w-xl flex-col gap-3 text-left">
            {props.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-ink">
                <CheckIcon className="mt-0.5 shrink-0 text-success" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackedCTA cta={props.primaryCta} location="hero" />
          {props.secondaryCta && (
            <TrackedCTA cta={props.secondaryCta} location="hero" />
          )}
        </div>

        {props.trust && (
          <p className="mt-6 text-sm text-ink-muted">{props.trust}</p>
        )}
      </div>
    </div>
  );
}
