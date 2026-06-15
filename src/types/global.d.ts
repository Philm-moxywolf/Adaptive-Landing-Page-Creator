// Ambient declarations for the Google Analytics global (gtag.js).

export {};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
