import { DemoDashboard } from "@/components/demo-dashboard";
import { CurtainLink } from "@/lib/curtain";

export const metadata = {
  title: "CTLYST — Working Demonstration",
  description:
    "An illustrative walkthrough of the CTLYST operating model: intake, diagnosis, the mentor and capital tracks, and the outcome ledger.",
};

export default function DemoPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-16 text-center">
        {/* Said plainly and up front. A pitch instrument that could be mistaken
            for live operations would be a liability, not an asset. */}
        <p className="t-mono-label mx-auto w-fit border border-crimson px-4 py-2 text-crimson">
          Demonstration · illustrative data · not live operations
        </p>
        <h1 className="t-display-l mt-8">
          The model, <em className="italic text-crimson">running.</em>
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[660px]">
          Everything on the rest of this site describes how CTLYST works. This page shows it —
          four founders mid-journey, the mentor bench behind them, and what a closed loop
          actually looks like.
        </p>
        <p className="t-caption mx-auto mt-5 max-w-[64ch]">
          Names and cases are invented. The mechanics, the schemes, and the illustrative 5%
          success fee are drawn from the project plan.
        </p>
      </div>

      <section className="py-16">
        <DemoDashboard />
      </section>

      <section className="mt-8 band px-8 py-20 text-center text-ink">
        <p className="t-mono-label text-gold">What this page is for</p>
        <h2 className="t-display-m mx-auto mt-7 max-w-[26ch]">
          A founder can be told how the loop works. An institution would rather{" "}
          <em className="italic text-gold">watch it turn.</em>
        </h2>
      </section>

      <section className="px-8 py-20 text-center">
        <CurtainLink
          href="/model"
          className="t-mono-label inline-block border border-ink px-9 py-4 text-ink transition-colors duration-[280ms] hover:bg-ink hover:text-paper"
        >
          Read the Model Behind It
        </CurtainLink>
      </section>
    </main>
  );
}
