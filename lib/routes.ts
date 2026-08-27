/** Single source of truth for the six routes. Nav, footer, and curtain all read this. */
export const ROUTES = [
  { href: "/",        label: "Home",      mark: "I" },
  { href: "/model",   label: "The Model", mark: "II" },
  { href: "/why",     label: "Why Us",    mark: "III" },
  { href: "/schemes", label: "Schemes",   mark: "IV" },
  { href: "/roadmap", label: "Roadmap",   mark: "V" },
  // Demo sits before Join so the CTA stays last in the nav and in the tab order.
  { href: "/demo",    label: "Demo",      mark: "VI" },
  // Join breaks the numbering on purpose. "VII" printed on the curtain read as
  // a seventh step — arriving at the front door having skipped six things you
  // were apparently meant to do first. The page's own lede calls it the front
  // door, so the curtain says that instead: an arrival, not a step count.
  { href: "/join",    label: "Join Us",   mark: "The Front Door" },
] as const;

export type Route = (typeof ROUTES)[number];

/** What the curtain prints while it covers the outgoing page. */
export const markFor = (path: string) =>
  ROUTES.find((r) => r.href === path)?.mark ?? "";
