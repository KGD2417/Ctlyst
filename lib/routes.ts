/** Single source of truth for the six routes. Nav, footer, and curtain all read this. */
export const ROUTES = [
  { href: "/",        label: "Home",      numeral: "I" },
  { href: "/model",   label: "The Model", numeral: "II" },
  { href: "/why",     label: "Why Us",    numeral: "III" },
  { href: "/schemes", label: "Schemes",   numeral: "IV" },
  { href: "/roadmap", label: "Roadmap",   numeral: "V" },
  // Demo sits before Join so the CTA stays last in the nav and in the tab order.
  { href: "/demo",    label: "Demo",      numeral: "VI" },
  { href: "/join",    label: "Join Us",   numeral: "VII" },
] as const;

export type Route = (typeof ROUTES)[number];

export const numeralFor = (path: string) =>
  ROUTES.find((r) => r.href === path)?.numeral ?? "";
