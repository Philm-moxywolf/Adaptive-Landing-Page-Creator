"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Section } from "@/lib/content-schema";
import { Eyebrow } from "@/components/ui/Primitives";
import { track, EVENTS } from "@/lib/analytics";
import { cn, ctaClasses } from "@/lib/cn";

type Props = Extract<Section, { type: "leadForm" }> & {
  conversionEventName: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LeadForm({ conversionEventName, ...props }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [startedTracked, setStartedTracked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const successRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation when the form is replaced (a11y).
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function handleFirstInteraction() {
    if (!startedTracked) {
      setStartedTracked(true);
      track(EVENTS.FORM_START, { form_id: props.id });
    }
  }

  function validate(data: Record<string, unknown>): Record<string, string> {
    const next: Record<string, string> = {};
    for (const field of props.fields) {
      const value = String(data[field.name] ?? "").trim();
      if (field.required && !value) {
        next[field.name] = `${field.label} is required.`;
      } else if (field.type === "email" && value && !EMAIL_RE.test(value)) {
        next[field.name] = "Enter a valid email address.";
      }
    }
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot: real users never fill this hidden field.
    if (data.company_website) {
      setStatus("success");
      return;
    }

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalid = props.fields.find((f) => validationErrors[f.name]);
      if (firstInvalid) {
        document.getElementById(`${props.id}_${firstInvalid.name}`)?.focus();
      }
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, form_id: props.id }),
      });
      if (!res.ok) throw new Error("Request failed");

      setStatus("success");
      track(EVENTS.FORM_SUBMIT, { form_id: props.id });
      track(conversionEventName, { form_id: props.id, value: 1 });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="container-lp py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-brand border border-line bg-surface p-8 shadow-sm">
        {status === "success" ? (
          <div
            ref={successRef}
            tabIndex={-1}
            className="py-8 text-center focus-visible:outline-none"
            role="status"
            aria-live="polite"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold">{props.successMessage}</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              {props.eyebrow && <Eyebrow>{props.eyebrow}</Eyebrow>}
              <h2 className="text-2xl font-bold sm:text-3xl">{props.headline}</h2>
              {props.subhead && (
                <p className="mt-2 text-ink-muted">{props.subhead}</p>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              onFocus={handleFirstInteraction}
              className="mt-6 flex flex-col gap-4"
              noValidate
            >
              {/* Honeypot — visually hidden, ignored by humans, filled by bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label htmlFor={`${props.id}_company_website`}>
                  Leave this field empty
                </label>
                <input
                  id={`${props.id}_company_website`}
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {props.fields.map((field) => {
                const fieldId = `${props.id}_${field.name}`;
                const errorId = `${fieldId}-error`;
                const error = errors[field.name];
                const shared = {
                  id: fieldId,
                  name: field.name,
                  required: field.required,
                  "aria-invalid": error ? true : undefined,
                  "aria-describedby": error ? errorId : undefined,
                } as const;
                return (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label
                      htmlFor={fieldId}
                      className="text-sm font-medium text-ink"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-accent" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      )}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        {...shared}
                        placeholder={field.placeholder}
                        rows={4}
                        className="rounded-brand border border-line bg-bg px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:border-brand"
                      />
                    ) : field.type === "select" ? (
                      <select
                        {...shared}
                        defaultValue=""
                        className="rounded-brand border border-line bg-bg px-4 py-3 text-ink focus-visible:border-brand"
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        {...shared}
                        type={field.type}
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                        className="rounded-brand border border-line bg-bg px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:border-brand"
                      />
                    )}
                    {error && (
                      <p id={errorId} role="alert" className="text-sm text-accent">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={status === "submitting"}
                className={cn(ctaClasses("primary"), "mt-2 w-full disabled:opacity-60")}
              >
                {status === "submitting" ? "Sending…" : props.submitLabel}
              </button>

              {status === "error" && (
                <p className="text-center text-sm text-accent" role="alert">
                  Something went wrong. Please try again.
                </p>
              )}

              {props.consentText && (
                <p className="text-center text-xs text-ink-muted">
                  {props.consentText}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
