"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ROLES, validate, type Field } from "@/lib/join-schema";

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/**
 * Underline-only inputs; the underline draws in crimson on focus. Inline
 * validation with real messages. On submit the fields collapse to a single line
 * and a crimson wax seal stamps down (L7).
 *
 * Accessibility: every error is tied to its field with aria-describedby and
 * aria-invalid, and the status region is aria-live, so the message is announced
 * rather than merely coloured.
 */

type Errors = Partial<Record<Field, string>>;
type State = "idle" | "sending" | "sent" | "failed";

const FIELDS: { name: Field; label: string; type?: string; autoComplete?: string }[] = [
  { name: "name",  label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
];

export function JoinForm() {
  const form = useRef<HTMLFormElement>(null);
  const sealWrap = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<State>("idle");
  const [failMsg, setFailMsg] = useState("");

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const readForm = () => {
    const fd = new FormData(form.current!);
    return Object.fromEntries(fd.entries()) as Record<string, string>;
  };

  const onBlur = (field: Field) => {
    const found = validate(readForm());
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = readForm();
    const found = validate(data);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // move focus to the first problem so a keyboard user lands on it
      const first = (Object.keys(found) as Field[])[0];
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.errors) {
          setErrors(body.errors);
          setState("idle");
          return;
        }
        setFailMsg(body?.message ?? "That did not go through. Try again in a moment.");
        setState("failed");
        return;
      }
      setState("sent");
    } catch {
      setFailMsg("That did not go through — check your connection and try again.");
      setState("failed");
    }
  }

  // The seal is stamped in an effect, not inline after setState: the element
  // does not exist until React has rendered the "sent" branch, so calling this
  // straight after setState found a null ref and the seal stayed invisible.
  useEffect(() => {
    if (state !== "sent") return;
    // Collapsing the form shortens the page by several hundred pixels, so every
    // ScrollTrigger below it holds stale start/end values — the six-questions
    // ledger stayed permanently invisible until this refresh was added.
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (!reduced()) stamp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function stamp() {
    const wrap = sealWrap.current;
    if (!wrap) return;
    const ring = wrap.querySelector("[data-seal-ring]");
    gsap.fromTo(wrap,
      { scale: 1.5, opacity: 0, rotate: -8 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.42, ease: "power4.out" });
    if (ring) {
      gsap.fromTo(ring, { drawSVG: "0%" },
        { drawSVG: "100%", duration: 0.6, ease: "power3.out", delay: 0.12 });
    }
  }

  if (state === "sent") {
    return (
      <div className="py-10 text-center" role="status" aria-live="polite">
        <div ref={sealWrap} className="mx-auto w-fit" style={reduced() ? undefined : { opacity: 0 }}>
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true" fill="none">
            <circle cx="52" cy="52" r="46" fill="var(--color-crimson)" opacity="0.1" />
            <circle data-seal-ring cx="52" cy="52" r="46" stroke="var(--color-crimson)" strokeWidth="1.5" />
            <text x="52" y="47" textAnchor="middle" fontFamily="var(--font-display)"
                  fontSize="27" fontWeight="600" fill="var(--color-crimson)">CTL</text>
            <text x="52" y="72" textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize="10" letterSpacing="3" fill="var(--color-crimson)">MMXXVI</text>
          </svg>
        </div>
        <p className="t-display-m mt-8">Your letter is recorded.</p>
        <p className="t-lede mx-auto mt-4 max-w-[46ch]">
          We reply to every serious note within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="mt-10">
      <div className="grid gap-x-10 gap-y-9 md:grid-cols-2">
        {FIELDS.map((f) => (
          <TextField key={f.name} {...f} error={errors[f.name]} onBlur={() => onBlur(f.name)} />
        ))}

        {/* A radio group, not a <select>: four mutually exclusive options is
            exactly what radios are for. Every option is individually labelled and
            announced, arrow keys move between them natively, and there is no
            popup layer to style or to trap focus in. */}
        <fieldset
          className="md:col-span-2"
          aria-invalid={!!errors.role}
          aria-describedby={errors.role ? "err-role" : undefined}
        >
          <legend className="t-mono-label text-muted">I am a…</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="group flex cursor-pointer items-start gap-3 border border-rule px-5 py-4 transition-colors duration-[280ms] has-[:checked]:border-crimson has-[:checked]:bg-paper-warm"
              >
                <input
                  type="radio" name="role" value={r.value}
                  onChange={() => setErrors((p) => ({ ...p, role: undefined }))}
                  className="mt-1.5 h-3 w-3 shrink-0 appearance-none rounded-full border border-ink-soft checked:border-crimson checked:bg-crimson"
                />
                <span className="text-[1.02rem] text-ink-soft">{r.label}</span>
              </label>
            ))}
          </div>
          <FieldError id="err-role" message={errors.role} />
        </fieldset>

        {/* Honeypot — humans never see this. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden opacity-0">
          <label htmlFor="f-website">Website</label>
          <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="f-message" className="t-mono-label block text-muted">
            Your note — what are you building, and where are you stuck?
          </label>
          <textarea
            id="f-message" name="message" rows={6} maxLength={2000}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "err-message" : undefined}
            onBlur={() => onBlur("message")}
            className="mt-3 w-full resize-y border-0 border-b border-rule bg-transparent py-3 text-[1.1rem] text-ink outline-none focus:border-crimson"
          />
          <FieldError id="err-message" message={errors.message} />
        </div>
      </div>

      <p className="t-caption mt-8">
        We reply to every serious note within 48 hours. Private &amp; confidential — your idea is yours.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button
          type="submit" disabled={state === "sending"}
          className="t-mono-label border border-crimson bg-crimson px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-crimson-deep disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send the Letter"}
        </button>
        <p role="status" aria-live="polite" className="t-caption not-italic text-crimson">
          {state === "failed" ? failMsg : ""}
        </p>
      </div>
    </form>
  );
}

function TextField({
  name, label, type = "text", autoComplete, error, onBlur,
}: { name: Field; label: string; type?: string; autoComplete?: string; error?: string; onBlur: () => void }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="t-mono-label block text-muted">{label}</label>
      <input
        id={`f-${name}`} name={name} type={type} autoComplete={autoComplete} maxLength={120}
        aria-invalid={!!error}
        aria-describedby={error ? `err-${name}` : undefined}
        onBlur={onBlur}
        className="mt-3 w-full border-0 border-b border-rule bg-transparent py-3 text-[1.1rem] text-ink outline-none focus:border-crimson"
      />
      <FieldError id={`err-${name}`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="t-caption mt-2 not-italic text-crimson">
      {message}
    </p>
  );
}
