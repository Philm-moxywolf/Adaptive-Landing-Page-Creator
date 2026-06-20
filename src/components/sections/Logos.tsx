import Image from "next/image";
import type { Section } from "@/lib/content-schema";

type Props = Extract<Section, { type: "logos" }>;

export function Logos(props: Props) {
  return (
    <div className="container-lp py-10">
      {props.title && (
        <p className="text-center text-sm font-medium uppercase tracking-wider text-ink-muted">
          {props.title}
        </p>
      )}
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {props.logos.map((logo, i) => (
          <li key={i} className="opacity-70">
            {logo.src ? (
              <Image
                src={logo.src}
                alt={logo.name}
                width={120}
                height={32}
                className="h-7 w-auto object-contain grayscale"
              />
            ) : (
              <span className="text-lg font-semibold tracking-tight text-ink-muted">
                {logo.name}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
