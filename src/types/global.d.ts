// Ambient declarations for the Google Analytics global (gtag.js).

export {};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    posthog?: {
      capture: (event: string, props?: Record<string, unknown>) => void;
      opt_in_capturing: () => void;
      opt_out_capturing: () => void;
      register: (props: Record<string, unknown>) => void;
    };
  }
}
