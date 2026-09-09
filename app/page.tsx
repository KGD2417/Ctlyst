import { SplitLines } from "@/lib/split-reveal";
import { CountUp } from "@/lib/count-up";
import { FourWalls } from "@/components/four-walls";
import { TriFold } from "@/components/trifold";
import { TheGap } from "@/components/the-gap";
import { CurtainLink } from "@/lib/curtain";

// PLAN §8: figure in mono at large size, unit in Garamond italic *beneath*.
// Setting the unit inline at display size overflowed the 4-up grid and made
// "34,000+" collide with "48%".
const STATS = [
  { to: 1.98,  dec: 2, unit: "lakh +",  label: "DPIIT-recognised startups" },
  { to: 21,    dec: 0, unit: "lakh +",  label: "Direct jobs created" },
  { to: 34000, dec: 0, unit: "and more", label: "Startups in Maharashtra alone" },
  { to: 48,    dec: 0, unit: "per cent", label: "With a woman director" },
];

export default function Home() {
  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────────────── */}
      {/* Centred on its own axis, and carrying nothing but the claim and the two
          doors. The lede that used to sit under the buttons now opens the page
          proper, below — three stacked blocks under one headline read as clutter. */}
      <section className="relative mx-auto max-w-[1180px] px-8 pb-16 pt-16 text-center md:pt-24">
        {/* Marginal annotations, as on an instrument. Both columns are drawn from
            copy that already exists on this site (INV-8): the left is the hero
            lede's three offers, the right is the three steps the model diagram
            names. Desktop only — at 390 they would crowd the headline. */}
        <ul aria-hidden="true" className="t-mono-label pointer-events-none absolute left-2 top-40 hidden space-y-2 text-left text-muted xl:block">
          {["Mentors", "Technical help", "Funding schemes"].map((t) => <li key={t}>{t}</li>)}
        </ul>
        <ul aria-hidden="true" className="t-mono-label pointer-events-none absolute right-2 top-40 hidden space-y-2 text-right text-muted xl:block">
          {["Diagnosis", "Match", "Outcome"].map((t) => <li key={t}>{t}</li>)}
        </ul>

        <h2 className="t-mono-label text-gold">Bridging the gap between ideas and execution</h2>
        <SplitLines className="t-display-xl mx-auto mt-8 max-w-[14ch]" delay={0.1} trigger={false}>
          <>
            No good idea should fail for want of{" "}
            <em className="italic grad-text">guidance.</em>
          </>
        </SplitLines>
        <div className="mt-12 flex flex-wrap justify-center gap-5">
          <CurtainLink href="/join" className="t-mono-label grad-fill group inline-flex items-center gap-3 border border-crimson/60 px-9 py-4 text-ink">
            Begin Your Journey
            <span aria-hidden="true" className="transition-transform duration-[280ms] group-hover:translate-x-1">&rarr;</span>
          </CurtainLink>
          <CurtainLink href="/model" className="t-mono-label group inline-flex items-center gap-3 border border-ink px-9 py-4 text-ink transition-colors duration-[280ms] hover:bg-ink hover:text-paper">
            Read the Model
            <span aria-hidden="true" className="transition-transform duration-[280ms] group-hover:translate-x-1">&rarr;</span>
          </CurtainLink>
        </div>
      </section>

      {/* The scroll cue: a hairline that fades downward into the page. */}
      <div className="flex flex-col items-center gap-3 pb-10">
        <p className="t-mono-label text-muted">Scroll to explore</p>
        <span aria-hidden="true" className="h-14 w-px bg-gradient-to-b from-muted/60 to-transparent" />
      </div>

      <p className="py-6 text-center text-xl" style={{ color: "var(--color-gold)" }}>❦</p>

      <section className="mx-auto max-w-[820px] px-8 pb-4 pt-6 text-center">
        <SplitLines className="t-lede" delay={0.1}>
          <>
            CTLYST unites experienced mentors, hands-on technical help, and India&rsquo;s
            under-used funding schemes into one hand-held journey — for the student founder
            the system was never built to find.
          </>
        </SplitLines>
      </section>

      {/* ── I · ecosystem in numbers ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-8 py-12" aria-labelledby="numbers-heading">
        <h2 className="t-mono-label text-gold">I. The Ecosystem in Numbers</h2>
        <h2 id="numbers-heading" className="sr-only">The ecosystem in numbers</h2>
        <div className="mt-10 grid border-y border-ink sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-start px-6 py-10 ${i < STATS.length - 1 ? "border-b border-rule lg:border-b-0 lg:border-r" : ""}`}>
              <span className="t-mono-figure">
                <CountUp to={s.to} decimals={s.dec} />
              </span>
              <span className="t-lede mt-1 block">{s.unit}</span>
              <span className="t-mono-label mt-6 block max-w-[22ch] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="t-caption mx-auto mt-6 max-w-[70ch] text-center">
          Source: DPIIT / Press Information Bureau, October–November 2025. India is now the
          world&rsquo;s third-largest startup ecosystem — averaging one newly recognised startup{" "}
          <em>every hour</em> for a decade.
        </p>
      </section>

      {/* ── pull quote ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[820px] px-8 py-14 text-center">
        <p className="font-display text-5xl leading-none text-gold">&ldquo;</p>
        <blockquote className="t-display-m mt-2 italic">
          Dream is not that which you see while sleeping; it is something that does not let you sleep.
        </blockquote>
        <cite className="t-mono-label mt-7 block not-italic text-muted">
          <span className="text-crimson">— </span>Dr. A. P. J. Abdul Kalam
        </cite>
      </section>

      {/* ── II · the four walls ──────────────────────────────────────── */}
      <FourWalls />

      {/* ── insight band ─────────────────────────────────────────────── */}
      <section className="my-10 band px-8 py-20 text-center text-ink">
        <h2 className="t-mono-label text-gold">The CTLYST Insight</h2>
        <h2 className="t-display-m mx-auto mt-8 max-w-[24ch]">
          The resources India&rsquo;s founders need <em className="italic text-gold">already exist.</em>{" "}
          What is missing is the one trusted place that connects the right resource to the right
          founder — <em className="italic text-gold">at the right time.</em>
        </h2>
        <CurtainLink href="/why" className="t-mono-label mt-10 inline-block border border-ink px-9 py-4 text-ink transition-colors duration-[280ms] hover:bg-ink hover:text-paper">
          Why We Are That Place
        </CurtainLink>
      </section>

      {/* ── The Gap · the signature ──────────────────────────────────── */}
      <TheGap />

      {/* ── III · tri-fold ───────────────────────────────────────────── */}
      <TriFold />

      <p className="py-6 text-center text-xl" style={{ color: "var(--color-gold)" }}>❦</p>

      {/* ── IV · the first step ──────────────────────────────────────── */}
      <section className="mx-auto max-w-[860px] px-8 py-20 text-center">
        <h2 className="t-mono-label text-gold">IV. The First Step</h2>
        <h2 className="t-display-m mx-auto mt-6 max-w-[22ch]">
          Your idea deserves more than a bookmark folder of schemes you never applied to.
        </h2>
        <p className="t-lede mx-auto mt-7 max-w-[58ch]">
          Tell us what you are building and where you are stuck. We diagnose the real bottleneck,
          match you to a mentor who has solved it before, and walk with you until the loop is closed.
        </p>
        <CurtainLink href="/join" className="t-mono-label mt-10 inline-block grad-fill border border-crimson/60 px-9 py-4 text-ink transition-[background] duration-[280ms]">
          Apply as a Founder
        </CurtainLink>
      </section>
    </main>
  );
}
