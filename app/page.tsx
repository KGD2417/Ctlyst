import { SplitLines } from "@/lib/split-reveal";
import { CountUp } from "@/lib/count-up";
import { FourWalls } from "@/components/four-walls";
import { TriFold } from "@/components/trifold";
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
      <section className="mx-auto max-w-[1180px] px-8 pb-24 pt-20 md:pt-28">
        <p className="t-mono-label text-gold">Bridging the gap between ideas and execution</p>
        {/* §9.6 misregistration — use 2 of 2 (the curtain numeral is use 1) */}
        <SplitLines className="t-display-xl mt-8 max-w-[14ch]" delay={0.1} trigger={false} misregister>
          <>
            No good idea should fail for want of{" "}
            <em className="italic text-crimson">guidance.</em>
          </>
        </SplitLines>
        <SplitLines className="t-lede mt-9 max-w-[620px]" delay={0.5} trigger={false}>
          <>
            CTLYST unites experienced mentors, hands-on technical help, and India&rsquo;s
            under-used funding schemes into one hand-held journey — for the student founder
            the system was never built to find.
          </>
        </SplitLines>
        <div className="mt-12 flex flex-wrap gap-5">
          <CurtainLink href="/join" className="t-mono-label border border-crimson bg-crimson px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-crimson-deep">
            Begin Your Journey
          </CurtainLink>
          <CurtainLink href="/model" className="t-mono-label border border-ink px-9 py-4 text-ink transition-colors duration-[280ms] hover:bg-ink hover:text-paper">
            Read the Model
          </CurtainLink>
        </div>
      </section>

      <p className="py-6 text-center text-xl text-gold">❦</p>

      {/* ── I · ecosystem in numbers ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-8 py-16" aria-labelledby="numbers-heading">
        <p className="t-mono-label text-gold">I. The Ecosystem in Numbers</p>
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
      <section className="mx-auto max-w-[820px] px-8 py-20 text-center">
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
      <section data-invert className="my-16 bg-ink px-8 py-24 text-center text-paper">
        <p className="t-mono-label text-gold">The CTLYST Insight</p>
        <h2 className="t-display-m mx-auto mt-8 max-w-[24ch]">
          The resources India&rsquo;s founders need <em className="italic text-gold">already exist.</em>{" "}
          What is missing is the one trusted place that connects the right resource to the right
          founder — <em className="italic text-gold">at the right time.</em>
        </h2>
        <CurtainLink href="/why" className="t-mono-label mt-10 inline-block border border-paper px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-paper hover:text-ink">
          Why We Are That Place
        </CurtainLink>
      </section>

      {/* ── III · tri-fold ───────────────────────────────────────────── */}
      <TriFold />

      <p className="py-6 text-center text-xl text-gold">❦</p>

      {/* ── IV · the first step ──────────────────────────────────────── */}
      <section className="mx-auto max-w-[860px] px-8 py-24 text-center">
        <p className="t-mono-label text-gold">IV. The First Step</p>
        <h2 className="t-display-m mx-auto mt-6 max-w-[22ch]">
          Your idea deserves more than a bookmark folder of schemes you never applied to.
        </h2>
        <p className="t-lede mx-auto mt-7 max-w-[58ch]">
          Tell us what you are building and where you are stuck. We diagnose the real bottleneck,
          match you to a mentor who has solved it before, and walk with you until the loop is closed.
        </p>
        <CurtainLink href="/join" className="t-mono-label mt-10 inline-block border border-crimson bg-crimson px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-crimson-deep">
          Apply as a Founder
        </CurtainLink>
      </section>
    </main>
  );
}
