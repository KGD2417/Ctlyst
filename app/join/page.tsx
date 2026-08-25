import { JoinForm } from "@/components/join-form";
import { Ledger } from "@/components/ledger";
import { Reveal } from "@/lib/draw-in";

const WHO = [
  { k: "Founders",    t: "You have an idea and a wall",     b: "Tell us what you are building and the single biggest blocker in front of you — technical, operational, or financial." },
  { k: "Mentors",     t: "You have experience and time",    b: "Retired engineer, professor, or industry veteran? Your decades of judgement are the rarest resource in this ecosystem.", tinted: true },
  { k: "Institutions", t: "You have students and a mandate", b: "Colleges, incubators, and CSR-minded corporates — offer your students a managed path from idea to funded prototype." },
];

const QUESTIONS = [
  { n: "i.",   title: "The blocker", body: "What is the single biggest blocker to moving your idea forward right now?" },
  { n: "ii.",  title: "The wall",    body: "When you hit a wall — technical, funding, or operations — what do you actually do today?" },
  { n: "iii.", title: "The search",  body: "Have you ever looked for mentorship, grants, or incubators? If not — why not?" },
  { n: "iv.",  title: "The schemes", body: "Do you know which government schemes or incubators you might already qualify for?" },
  { n: "v.",   title: "The offer",   body: "If someone connected you to an experienced mentor and showed you 3–5 relevant schemes — would that meaningfully help?" },
  { n: "vi.",  title: "The counsel", body: "Who do you currently turn to for advice — seniors, professors, online communities?" },
];

export default function JoinPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <h2 className="t-mono-label text-gold">Join Us</h2>
        <h1 className="t-display-l mt-6">
          Tell us where you are <em className="italic text-crimson">stuck.</em>
        </h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">
          Founders, mentors, and institutions — this is the front door.
          Write plainly; we read everything.
        </p>
      </div>

      <section className="mx-auto max-w-[1180px] px-8 py-20">
        <h2 className="t-mono-label text-gold">I. Who Should Write</h2>
        <Reveal className="mt-10 grid gap-6 md:grid-cols-3" selector="[data-row]" stagger={0.09}>
          {WHO.map((w) => (
            <article key={w.k} data-row className={`border border-rule p-8 ${w.tinted ? "bg-paper-warm" : ""}`}>
              <span className="t-mono-label text-gold">{w.k}</span>
              <h3 className="t-subhead mt-4">{w.t}</h3>
              <p className="mt-3 text-ink-soft">{w.b}</p>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto max-w-[780px] px-8 py-10">
        <h2 className="t-mono-label text-gold">II. The Letter</h2>
        <JoinForm />
      </section>

      <section className="mx-auto max-w-[1180px] px-8 py-20">
        <h2 className="t-mono-label text-gold">III. Before You Write — Six Questions Worth Asking Yourself</h2>
        <Ledger rows={QUESTIONS} />
      </section>

      <section className="mx-auto max-w-[820px] px-8 py-16 text-center">
        <p className="font-display text-5xl leading-none text-gold">&ldquo;</p>
        <blockquote className="t-display-m mt-2 italic">
          Start where you are. Use what you have. Do what you can.
        </blockquote>
        <cite className="t-mono-label mt-7 block not-italic text-muted">
          <span className="text-crimson">— </span>Arthur Ashe
        </cite>
      </section>
    </main>
  );
}
