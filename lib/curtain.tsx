"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate } from "motion";
import { numeralFor } from "@/lib/routes";
import { scrollToTop } from "@/lib/scroll-provider";

/**
 * Crimson curtain wipe, under 700ms end to end.
 *
 * The overlay deliberately lives OUTSIDE the route tree. App Router unmounts the
 * outgoing page the instant you push, so an AnimatePresence exit animation on the
 * page itself gets torn down mid-flight. Driving a fixed overlay imperatively
 * sidesteps that entirely, and lets us reset scroll while the view is covered.
 *
 * Sequence: cover (crimson rises) → push + reset scroll → reveal (continues up).
 * One continuous upward motion, like a page turning.
 */

const BRAND_EASE = [0.22, 1, 0.36, 1] as const;
const COVER  = 0.26; // s
const HOLD   = 0.05; // s
const REVEAL = 0.26; // s  → 570ms nominal, leaving headroom under the 700ms gate

const CurtainCtx = createContext<(href: string) => void>(() => {});
export const useCurtain = () => useContext(CurtainCtx);

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);
  const [numeral, setNumeral] = useState("");
  const pending = useRef<string | null>(null);
  const busy = useRef(false);

  const reduced = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (reduced.current = mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const navigate = useCallback(
    async (href: string) => {
      if (busy.current || href === pathname) return;
      const el = sheet.current;

      // INV-2 — no wipe under reduced motion. Straight there, no theatre.
      if (reduced.current || !el) {
        router.push(href);
        scrollToTop();
        return;
      }

      busy.current = true;
      pending.current = href;
      setNumeral(numeralFor(href));
      el.style.visibility = "visible";

      // type:"tween" is load-bearing — motion defaults to a physics curve that INV-7 forbids.
      await animate(el, { transform: ["translateY(100%)", "translateY(0%)"] },
        { type: "tween", duration: COVER, ease: BRAND_EASE });

      router.push(href);
      scrollToTop();
    },
    [pathname, router],
  );

  // Reveal only once the destination has actually painted.
  useEffect(() => {
    if (pending.current === null || pending.current !== pathname) return;
    pending.current = null;
    const el = sheet.current;
    if (!el) return;

    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, HOLD * 1000));
        if (cancelled) return;
        await animate(el, { transform: ["translateY(0%)", "translateY(-100%)"] },
          { type: "tween", duration: REVEAL, ease: BRAND_EASE });
        if (cancelled) return;
        el.style.visibility = "hidden";
        setNumeral("");
        busy.current = false;
      }),
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      busy.current = false;
    };
  }, [pathname]);

  return (
    <CurtainCtx.Provider value={navigate}>
      {children}
      <div
        ref={sheet}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-crimson"
        style={{ transform: "translateY(100%)", visibility: "hidden" }}
      >
        {/* §9.6 misregistration — use 1 of 2. The numeral prints slightly out of
            register, then snaps true, like a plate not quite aligned. */}
        <span className="relative" aria-hidden="true">
          <span
            className="absolute inset-0 text-paper/40"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(4rem, 12vw, 10rem)",
              transform: "translate(var(--misreg), calc(var(--misreg) * -0.5))",
            }}
          >
            {numeral}
          </span>
          <span
            className="relative text-paper"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(4rem, 12vw, 10rem)" }}
          >
            {numeral}
          </span>
        </span>
      </div>
    </CurtainCtx.Provider>
  );
}

/** A real anchor — so Tab, Enter, and middle-click all behave (INV-5). */
export function CurtainLink({
  href, children, className, ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigate = useCurtain();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
