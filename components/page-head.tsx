import type { ReactNode } from "react";

/** Shared route header. L2 stub — each route grows its own body from L6. */
export function PageHead({
  crumb, title, sub,
}: { crumb: string; title: ReactNode; sub: string }) {
  return (
    <main className="min-h-[70vh]">
      <div className="mx-auto max-w-[1080px] border-b border-rule px-8 py-20 text-center">
        <p className="t-mono-label text-gold">{crumb}</p>
        <h1 className="t-display-l mt-6">{title}</h1>
        <p className="t-lede mx-auto mt-7 max-w-[640px]">{sub}</p>
      </div>
    </main>
  );
}
