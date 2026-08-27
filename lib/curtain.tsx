"use client";

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { wipe } from "@/lib/ui-motion";
import { markFor } from "@/lib/routes";
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

const COVER  = 0.26; // s
const HOLD   = 0.05; // s
const REVEAL = 0.26; // s  → 570ms nominal, leaving headroom under the 700ms gate

/** Roman numerals get the full plate; a word has to fit the viewport. */
const markType = (mark: string): React.CSSProperties =>
  /^[IVX]+$/.test(mark)
    ? { fontFamily: "var(--font-display)", fontSize: "clamp(4rem, 12vw, 10rem)" }
    : { fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 6vw, 4.5rem)", fontStyle: "italic" };

const CurtainCtx = createContext<(href: string) => void>(() => {});
export const useCurtain = () => useContext(CurtainCtx);

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState("");
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
      setMark(markFor(href));
      el.style.visibility = "visible";

      // Motion drives this through WAAPI, so the wipe runs on the compositor
      // and a busy main thread cannot stutter it mid-transition.
      el.style.transform = "translateY(100%)";
      await wipe(el, "cover", COVER);

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
        await wipe(el, "reveal", REVEAL);
        if (cancelled) return;
        el.style.visibility = "hidden";
        setMark("");
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
        style={{ transform: "translateY(100%)", visibility: "hidden", willChange: "transform" }}
      >
        {/* §9.6 misregistration — use 1 of 2. The mark prints slightly out of
            register, then snaps true, like a plate not quite aligned.
            Words set smaller and in italic than the numerals — "The Front Door"
            at numeral size would run off both edges of a phone. */}
        <span className="relative whitespace-nowrap" aria-hidden="true">
          <span
            className="absolute inset-0 text-paper/40"
            style={{ ...markType(mark), transform: "translate(var(--misreg), calc(var(--misreg) * -0.5))" }}
          >
            {mark}
          </span>
          <span className="relative text-paper" style={markType(mark)}>
            {mark}
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
