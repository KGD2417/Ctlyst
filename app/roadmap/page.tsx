import { Timeline } from "@/components/timeline";
import { Reveal } from "@/lib/draw-in";
import { CurtainLink } from "@/lib/curtain";

const CAPITAL = [
  { phase: "Validation (0–3 mo)", focus: "Discovery and manual pilots", costs: "Travel, communications, founder's time", budget: "₹0 – 50,000" },
  { phase: "Early operations (3–12 mo)", focus: "Small cohort, basic platform", costs: "Simple tools, part-time help, outreach, light mentor incentives", budget: "₹5 – 15 lakh" },
  { phase: "Growth (Year 2+)", focus: "Team, technology, multi-city expansion", costs: "Salaries, platform development, marketing", budget: "₹25 lakh+ (raise / grants)" },
];

const MILESTONES = [
  { k: "0–6 months",  t: "Validation",    b: "15–20 discovery talks completed · 2–3 successful manual matches · the problem confirmed or honestly refined." },
  { k: "6–18 months", t: "Early Traction", b: "First cohort run · 1–2 institutional partners · the first rupee of revenue · a basic platform live.", tinted: true },
  { k: "2–3 years",   t: "Scale Test",    b: "A repeatable model · expansion to a second and third city · sustainable unit economics — or a clear-eyed pivot." },
];

export default function RoadmapPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <h2 className="t-mono-label text-gold">The Roadmap</h2>
        <h1 className="t-display-l mt-6">
          Evidence before <em className="italic text-crimson">expenditure.</em>
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">
          We build nothing until real founders prove it worth building. This is the
          discipline we practise — and the discipline we teach.
        </p>
      </div>

      <section className="mx-auto max-w-[900px] px-8 py-20">
        <h2 className="t-mono-label text-gold">I. The Road Ahead</h2>
        <Timeline />
      </section>

      <section className="my-12 band px-8 py-24 text-center text-ink">
        <h2 className="t-mono-label text-gold">A Sobering Truth We Plan Around</h2>
        <h2 className="t-display-m mx-auto mt-8 max-w-[26ch]">
          Most ventures fail from running out of <em className="italic text-gold">money or patience</em> —
          not from a bad idea. We pace our spending and our promises accordingly.
        </h2>
      </section>

      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <h2 className="t-mono-label text-gold">II. Capital Discipline</h2>
        <h2 className="t-display-m mt-6">
          Deliberately <em className="italic text-crimson">capital-light.</em>
        </h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <caption className="t-caption caption-bottom pt-4 text-left">
              Bootstrap first. Government grants and CSR sponsorship offset early costs;
              external capital only once a repeatable model and clear unit economics exist.
              The cardinal rule: never hire or build ahead of validation.
            </caption>
            <thead>
              <tr>
                {["Phase", "Focus", "Main costs", "Est. budget"].map((h) => (
                  <th key={h} className="t-mono-label border-b border-t-2 border-ink px-4 py-3 text-left text-ink">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPITAL.map((r) => (
                <tr key={r.phase}>
                  <th scope="row" className="border-b border-rule px-4 py-4 text-left align-top font-semibold">{r.phase}</th>
                  <td className="border-b border-rule px-4 py-4 align-top text-ink-soft">{r.focus}</td>
                  <td className="border-b border-rule px-4 py-4 align-top text-ink-soft">{r.costs}</td>
                  <td className="border-b border-rule px-4 py-4 align-top font-mono text-[0.95rem] text-ink">{r.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="py-6 text-center text-xl" style={{ color: "var(--color-gold)" }}>❦</p>

      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <h2 className="t-mono-label text-gold">III. Milestones We Hold Ourselves To</h2>
        <Reveal className="mt-10 grid gap-6 md:grid-cols-3" selector="[data-row]" stagger={0.09}>
          {MILESTONES.map((m) => (
            <article key={m.t} data-row className={`border border-rule p-8 ${m.tinted ? "bg-paper-warm" : ""}`}>
              <span className="t-mono-label text-gold">{m.k}</span>
              <h3 className="t-subhead mt-4">{m.t}</h3>
              <p className="mt-3 text-ink-soft">{m.b}</p>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="px-8 py-20 text-center">
        <CurtainLink href="/join" className="t-mono-label inline-block grad-fill border border-crimson/60 px-9 py-4 text-ink transition-[background] duration-[280ms]">
          Walk This Road With Us
        </CurtainLink>
      </section>
    </main>
  );
}
