import { SchemeCards } from "@/components/scheme-cards";
import { Reveal } from "@/lib/draw-in";
import { CurtainLink } from "@/lib/curtain";

export default function SchemesPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <h2 className="t-mono-label text-gold">The Resource Ledger</h2>
        <h1 className="t-display-l mt-6">
          The money is <em className="italic text-crimson">already there.</em><br />We help you reach it.
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">
          A reference to the major Government of India schemes we navigate with our founders —
          substantial, well-funded, and chronically under-used.
        </p>
      </div>

      <section className="mx-auto max-w-[1180px] px-8 py-20">
        <h2 className="t-mono-label text-gold">I. The Six Instruments</h2>
        <SchemeCards />
        <p className="t-caption mx-auto mt-10 max-w-[74ch] text-center">
          Indicative as of late 2025. Scheme terms, corpus sizes, and eligibility evolve —
          we verify current terms on the official{" "}
          <a href="https://www.startupindia.gov.in" rel="noopener noreferrer" target="_blank"
             className="text-crimson underline underline-offset-4">Startup India portal</a>{" "}
          before advising any founder.
        </p>
      </section>

      <section data-invert className="my-12 bg-ink px-8 py-24 text-center text-paper">
        <h2 className="t-mono-label text-gold">Why This Page Exists</h2>
        <h2 className="t-display-m mx-auto mt-8 max-w-[26ch]">
          Awareness of these schemes remains uneven —{" "}
          <em className="italic text-gold">lowest exactly where the need is highest:</em>{" "}
          among first-time and small-city founders. That gap is where CTLYST stands.
        </h2>
      </section>

      <section className="mx-auto max-w-[780px] px-8 py-16">
        <h2 className="t-mono-label text-gold">II. A Worked Example</h2>
        <h2 className="t-display-m mt-6">
          What navigation is <em className="italic text-crimson">worth.</em>
        </h2>
        <Reveal className="mt-8" selector="[data-row]">
          <p data-row className="text-[1.25rem] leading-[1.75] text-ink-soft [&::first-letter]:float-left [&::first-letter]:pr-2 [&::first-letter]:pt-1 [&::first-letter]:font-display [&::first-letter]:text-[4.6rem] [&::first-letter]:leading-[0.82] [&::first-letter]:text-crimson">
            Suppose a student team has a working concept for an agri-tech device but no money
            for a prototype. Alone, they might spend a year cold-emailing investors. With
            CTLYST, the path is different: we match them to a retired production engineer who
            refines the design for manufacturability, map them to the Seed Fund Scheme&rsquo;s
            prototype grant of up to ₹20 lakh through an approved incubator, and support the
            application end-to-end. If a founder secures a ₹5 lakh grant through us, our
            illustrative 5% success fee is ₹25,000 — paid from money they would never
            otherwise have found. The founder builds; the mentor contributes; the scheme
            fulfils its purpose. Everyone leaves the table better off.
          </p>
        </Reveal>
      </section>

      <section className="px-8 py-20 text-center">
        <CurtainLink href="/join" className="t-mono-label inline-block border border-crimson bg-crimson px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-crimson-deep">
          Find the Scheme You Qualify For
        </CurtainLink>
      </section>
    </main>
  );
}
