export {};

type ChromeGlobal = typeof globalThis extends { chrome: infer T } ? T : undefined;

declare global {
  const chrome: ChromeGlobal;

  interface Window {
    chrome?: ChromeGlobal;
  }
}
