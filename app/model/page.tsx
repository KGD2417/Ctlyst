import { Ledger } from "@/components/ledger";
import { ProcessDiagram } from "@/components/process-diagram";
import { Reveal } from "@/lib/draw-in";
import { CurtainLink } from "@/lib/curtain";

const STEPS = [
  { n: "i.",   title: "Intake",          body: "You submit your idea and your specific unmet needs — skills, prototype, operations, mentorship, or funding." },
  { n: "ii.",  title: "Diagnosis",       body: "We clarify your real bottleneck and your true stage — rather than taking the stated need at face value." },
  { n: "iii.", title: "Matching",        body: "You are connected to a suitable mentor or advisor and, where relevant, to hands-on technical or operational help." },
  { n: "iv.",  title: "Resource Mapping", body: "We surface the incubators, grants, subsidies, and schemes most relevant to your stage and sector." },
  { n: "v.",   title: "Facilitation",    body: "We support introductions, applications, and follow-through — so opportunities convert into outcomes, not bookmarks." },
  { n: "vi.",  title: "Tracking",        body: "Progress is monitored, feedback is gathered, and matches are refined over time. Success is measured by founders actually advancing." },
];

const PHASES = [
  { k: "Phase I",   t: "Home Base — Mumbai",     b: "Launch hyper-locally, using our own college and personal networks to run the first manual matches and build living proof." },
  { k: "Phase II",  t: "Tier-2 & Tier-3 Cities", b: "Expand into smaller Maharashtra cities and neighbouring regions — where competition is thin and the awareness gap is widest." },
  { k: "Phase III", t: "Replicate the Playbook", b: "Once a repeatable city-level model works, extend it state by state, adapting to each state's startup policies." },
];

export default function ModelPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <p className="t-mono-label text-gold">The Model</p>
        <h1 className="t-display-l mt-6">
          Not another directory.<br />A <em className="italic text-crimson">done-with-you</em> ecosystem.
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">
          CTLYST begins as a curated, human-run service and evolves into a platform —
          because trust is built by hand before it is built by software.
        </p>
      </div>

      {/* I · vision & mission */}
      <section className="mx-auto max-w-[1180px] px-8 py-20">
        <p className="t-mono-label text-gold">I. Vision &amp; Mission</p>
        <Reveal className="mt-10 grid gap-6 md:grid-cols-2" selector="[data-row]">
          <article data-row className="border border-rule bg-paper-warm p-8">
            <span className="t-mono-label text-gold">Vision</span>
            <h3 className="t-subhead mt-4">An India where no good idea fails</h3>
            <p className="mt-3 text-ink-soft">— for lack of guidance, skills, or awareness of the support that already exists around it.</p>
          </article>
          <article data-row className="border border-rule p-8">
            <span className="t-mono-label text-gold">Mission</span>
            <h3 className="t-subhead mt-4">Connect founders to what moves them forward</h3>
            <p className="mt-3 text-ink-soft">Experienced mentors, practical hands-on help, and the right funding and government schemes — through one trusted, high-touch ecosystem.</p>
          </article>
        </Reveal>
      </section>

      {/* II · how it works */}
      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <p className="t-mono-label text-gold">II. How It Works</p>
        <h2 className="t-display-m mt-6">
          Six steps from <em className="italic text-crimson">stuck</em> to <em className="italic text-crimson">moving.</em>
        </h2>
        <Ledger rows={STEPS} />
      </section>

      {/* III · the operating model — §10 corrected */}
      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <p className="t-mono-label text-gold">III. The Operating Model</p>
        <h2 className="t-display-m mt-6 max-w-[20ch]">
          Three pipelines in. Two tracks out. <em className="italic text-crimson">One loop.</em>
        </h2>
        <ProcessDiagram />
      </section>

      {/* distinction band */}
      <section data-invert className="my-16 bg-ink px-8 py-24 text-center text-paper">
        <p className="t-mono-label text-gold">The Distinction</p>
        <h2 className="t-display-m mx-auto mt-8 max-w-[26ch]">
          Mentorship <em className="italic text-gold">+</em> technical help <em className="italic text-gold">+</em> funding{" "}
          <em className="italic text-gold">+</em> scheme navigation — each exists somewhere.
          Integrating all of them around <em className="italic text-gold">one founder</em> is what almost no one does.
        </h2>
      </section>

      {/* IV · where we begin */}
      <section className="mx-auto max-w-[1180px] px-8 py-16">
        <p className="t-mono-label text-gold">IV. Where We Begin</p>
        <h2 className="t-display-m mt-6">
          Hyperlocal first. <em className="italic text-crimson">Under-served India</em> next.
        </h2>
        <Reveal className="mt-12 grid gap-6 md:grid-cols-3" selector="[data-row]" stagger={0.09}>
          {PHASES.map((p) => (
            <article key={p.k} data-row className="border border-rule p-8">
              <span className="t-mono-label text-gold">{p.k}</span>
              <h3 className="t-subhead mt-4">{p.t}</h3>
              <p className="mt-3 text-ink-soft">{p.b}</p>
            </article>
          ))}
        </Reveal>
        <p className="t-lede mt-12 max-w-[70ch]">
          Metros are already well-served; we treat them as a learning ground, not the
          destination. The defensible opportunity lies in the cities beyond them — where
          founders have the least access and the most to gain.
        </p>
      </section>

      <section className="px-8 py-20 text-center">
        <CurtainLink href="/why" className="t-mono-label inline-block border border-crimson bg-crimson px-9 py-4 text-paper transition-colors duration-[280ms] hover:bg-crimson-deep">
          See Why Founders Choose Us
        </CurtainLink>
      </section>
    </main>
  );
}
