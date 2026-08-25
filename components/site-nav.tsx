"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CurtainLink } from "@/lib/curtain";
import { ROUTES } from "@/lib/routes";
import { Monogram } from "@/lib/monogram";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change, and on Escape (INV-5 — keyboard must get back out)
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = (href: string) => {
    const active = pathname === href;
    if (href === "/join") {
      return `t-mono-label border px-5 py-2.5 transition-colors duration-[280ms] ${
        active ? "border-crimson bg-crimson text-paper" : "border-ink text-ink hover:bg-ink hover:text-paper"
      }`;
    }
    return `t-mono-label border-b pb-1 transition-colors duration-[280ms] ${
      active ? "border-crimson text-crimson" : "border-transparent text-ink-soft hover:text-crimson"
    }`;
  };

  return (
    <>
      <header className="sticky top-0 z-[120] border-b border-rule bg-paper/94 backdrop-blur-md">
      <div className="t-mono-label border-b border-rule py-2 text-center text-muted">
        Mumbai · Maharashtra · Est. MMXXVI
      </div>

      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-4">
        <CurtainLink
          href="/"
          data-navmark
          className="block text-ink"
          aria-label="CTLYST — home"
        >
          <Monogram className="h-7 w-auto" strokeWidth={7} />
        </CurtainLink>

        {/* desktop */}
        <ul className="hidden items-center gap-8 md:flex">
          {ROUTES.slice(1).map((r) => (
            <li key={r.href}>
              <CurtainLink
                href={r.href}
                aria-current={pathname === r.href ? "page" : undefined}
                className={linkClass(r.href)}
              >
                {r.label}
              </CurtainLink>
            </li>
          ))}
        </ul>

        {/* mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="border border-rule px-3 py-2.5 md:hidden"
        >
          <span className={`block h-px w-5 bg-ink transition-transform duration-[280ms] ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`my-[5px] block h-px w-5 bg-ink transition-opacity duration-[280ms] ${open ? "opacity-0" : ""}`} />
          <span className={`block h-px w-5 bg-ink transition-transform duration-[280ms] ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </nav>
      </header>

      {/* Sibling of <header>, not a child: backdrop-filter on the header would
          make it the containing block for this fixed panel. Hidden from the tab
          order entirely when closed (INV-5). */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-9 bg-paper pt-24 md:hidden"
      >
        {ROUTES.map((r) => (
          <CurtainLink
            key={r.href}
            href={r.href}
            aria-current={pathname === r.href ? "page" : undefined}
            className={`t-mono-label text-base ${pathname === r.href ? "text-crimson" : "text-ink-soft"}`}
          >
            {r.label}
          </CurtainLink>
        ))}
      </div>
    </>
  );
}
