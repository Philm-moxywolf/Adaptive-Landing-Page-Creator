import type { Section } from "@/lib/content-schema";
import { TrackedCTA } from "@/components/tracking/TrackedCTA";

type Props = Extract<Section, { type: "finalCta" }>;

export function FinalCta(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-3xl rounded-brand bg-brand px-6 py-14 text-center text-brand-fg sm:px-12">
        <h2 className="text-3xl font-bold sm:text-4xl">{props.headline}</h2>
        {props.subhead && (
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            {props.subhead}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackedCTA
            cta={props.cta}
            location="final"
            className="bg-bg text-ink hover:opacity-90"
          />
          {props.secondaryCta && (
            <TrackedCTA
              cta={props.secondaryCta}
              location="final"
              className="border-brand-fg/40 bg-transparent text-brand-fg hover:bg-brand-fg/10"
            />
          )}
        </div>
      </div>
    </div>
  );
}
