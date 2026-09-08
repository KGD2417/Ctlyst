import { Ledger } from "@/components/ledger";
import { ComparisonTable } from "@/components/comparison-table";
import { CountUp } from "@/lib/count-up";
import { Reveal } from "@/lib/draw-in";
import { CurtainLink } from "@/lib/curtain";

const REASONS = [
  { n: "i.",   title: "Integration, not just introduction", body: <>One place that handles mentorship, practical help, and funding access <em>together</em> — not a referral to three separate systems that never speak to each other.</> },
  { n: "ii.",  title: "A curated retiree mentor network", body: "Deep, low-cost, purpose-driven expertise from retired engineers, professors, and industry veterans — a supply pool that platforms built on peer founders simply do not tap." },
  { n: "iii.", title: "High-touch and done-with-you", body: "Hands-on support and follow-through, versus the largely self-serve incumbents. We do not point at the door; we walk through it with you." },
  { n: "iv.",  title: "Hyperlocal trust", body: "Built for students and under-served Tier-2 and Tier-3 cities — relationships and credibility that national platforms cannot replicate from a dashboard." },
  { n: "v.",   title: "We close the loop", body: "Success is measured by founders actually advancing — a prototype built, a grant secured — never by a connection merely made." },
];

const FIGURES = [
  { to: 10000, unit: "crore", label: "Fund of Funds corpus", prefix: "₹" },
  { to: 945,   unit: "crore", label: "Seed Fund Scheme corpus", prefix: "₹" },
  { to: 50,    unit: "lakh",  label: "Max seed funding per startup", prefix: "₹" },
  { to: 3,     unit: "years", label: "Income-tax holiday (80-IAC)", prefix: "" },
];

export default function WhyPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <h2 className="t-mono-label text-gold">Why Us</h2>
        <h1 className="t-display-l mt-6">
          Why students should make us their <em className="italic text-crimson">first choice.</em>
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">
          Not because the idea is novel — but because nobody else closes the loop.
        </p>
      </div>

      <section className="mx-auto max-w-[1180px] px-8 py-20">
        <h2 className="t-mono-label text-gold">I. Five Reasons</h2>
        <Ledger rows={REASONS} />
      </section>

      <section className="my-12 band px-8 py-24 text-center text-ink">
        <h2 className="t-mono-label text-gold">The Facts on Our Side</h2>
        <h2 className="t-display-m mx-auto mt-8 max-w-[26ch]">
          ₹945 crore sits in the Seed Fund Scheme. Grants of up to{" "}
          <em className="italic text-gold">₹20 lakh</em> exist for prototypes alone.
          Most student founders have <em className="italic text-gold">never heard of either.</em>
        </h2>
      </section>

      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <h2 className="t-mono-label text-gold">II. The Numbers That Matter</h2>
        <div className="mt-10 grid border-y border-ink sm:grid-cols-2 lg:grid-cols-4">
          {FIGURES.map((f, i) => (
            <div key={f.label} className={`flex flex-col items-start px-6 py-10 ${i < FIGURES.length - 1 ? "border-b border-rule lg:border-b-0 lg:border-r" : ""}`}>
              <span className="t-mono-figure">
                <CountUp to={f.to} prefix={f.prefix} />
              </span>
              <span className="t-lede mt-1 block">{f.unit}</span>
              <span className="t-mono-label mt-6 block max-w-[22ch] text-muted">{f.label}</span>
            </div>
          ))}
        </div>
        <p className="t-caption mx-auto mt-6 max-w-[70ch] text-center">
          Every rupee above already exists, funded by the Government of India. The gap is
          awareness and navigation — the gap we close.
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <h2 className="t-mono-label text-gold">III. An Honest Comparison</h2>
        <h2 className="t-display-m mt-6">
          We respect the incumbents. We simply <em className="italic text-crimson">finish what they start.</em>
        </h2>
        <ComparisonTable />
      </section>

      <p className="py-6 text-center text-xl" style={{ color: "var(--color-gold)" }}>❦</p>

      {/* The candour section — held plain on purpose. It persuades by being unadorned. */}
      <section className="mx-auto max-w-[780px] px-8 py-16">
        <h2 className="t-mono-label text-gold">IV. Our Candour</h2>
        <Reveal className="mt-8" selector="[data-row]">
          <p data-row className="text-[1.25rem] leading-[1.75] text-ink-soft [&::first-letter]:float-left [&::first-letter]:pr-2 [&::first-letter]:pt-1 [&::first-letter]:font-display [&::first-letter]:text-[4.6rem] [&::first-letter]:leading-[0.82] [&::first-letter]:text-crimson">
            We will tell you what most pitch decks will not: the concept itself is not unique,
            and we do not pretend otherwise. Our edge cannot rest on novelty — it must be
            earned through execution quality, the calibre of our mentor bench, local
            credibility, and a demonstrated ability to get founders funded and building.
            That is exactly the standard we ask you to hold us to. A platform that measures
            itself by connections made will show you a big number. We would rather show you
            a founder who shipped.
          </p>
        </Reveal>
      </section>

      <section className="px-8 py-20 text-center">
        <CurtainLink href="/join" className="t-mono-label inline-block grad-fill border border-crimson/60 px-9 py-4 text-ink transition-[background] duration-[280ms]">
          Make Us Your First Call
        </CurtainLink>
      </section>
    </main>
  );
}
