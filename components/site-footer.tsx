import { CurtainLink } from "@/lib/curtain";
import { ROUTES } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-ink py-14 text-center">
      <div className="font-display text-3xl uppercase tracking-[0.3em] pl-[0.3em]">CTLYST</div>
      <p className="t-caption mt-2">Bridging the gap between ideas and execution.</p>
      <ul className="mt-7 flex flex-wrap justify-center gap-7">
        {ROUTES.map((r) => (
          <li key={r.href}>
            <CurtainLink href={r.href} className="t-mono-label text-ink-soft hover:text-crimson">
              {r.label}
            </CurtainLink>
          </li>
        ))}
      </ul>
      <p className="t-caption mt-9">
        © MMXXVI CTLYST · Mumbai, Maharashtra, India · Private &amp; Confidential
      </p>
    </footer>
  );
}
