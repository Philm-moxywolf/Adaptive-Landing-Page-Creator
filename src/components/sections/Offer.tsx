import type { Section } from "@/lib/content-schema";
import { Eyebrow, SectionHeading, Lead, CheckIcon } from "@/components/ui/Primitives";
import { TrackedCTA } from "@/components/tracking/TrackedCTA";

type Props = Extract<Section, { type: "offer" }>;

export function Offer(props: Props) {
  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
        <SectionHeading>{props.headline}</SectionHeading>
        {props.subhead && <Lead>{props.subhead}</Lead>}
      </div>

      <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-brand border border-line bg-surface shadow-sm">
        {props.price && (
          <div className="border-b border-line bg-brand-muted px-8 py-8 text-center">
            <div className="flex items-end justify-center gap-2">
              {props.price.compareAt && (
                <span className="text-xl text-ink-muted line-through">
                  {props.price.compareAt}
                </span>
              )}
              <span className="text-5xl font-extrabold text-ink">
                {props.price.amount}
              </span>
              {props.price.period && (
                <span className="pb-1.5 text-ink-muted">
                  {props.price.period}
                </span>
              )}
            </div>
            {props.price.note && (
              <p className="mt-2 text-sm text-ink-muted">{props.price.note}</p>
            )}
          </div>
        )}

        <div className="px-8 py-8">
          <ul className="flex flex-col gap-3">
            {props.includes.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 shrink-0 text-success" />
                <span>
                  <span className="font-medium text-ink">{item.title}</span>
                  {item.body && (
                    <span className="block text-sm text-ink-muted">
                      {item.body}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <TrackedCTA cta={props.cta} location="offer" fullWidth />
          </div>

          {props.urgency && (
            <p className="mt-3 text-center text-sm font-medium text-accent">
              {props.urgency}
            </p>
          )}

          {props.guarantee && (
            <div className="mt-6 rounded-brand border border-dashed border-line p-4 text-center">
              <p className="font-semibold text-ink">{props.guarantee.title}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {props.guarantee.body}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
