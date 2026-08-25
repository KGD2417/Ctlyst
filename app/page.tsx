import Link from "next/link";

export default function Home() {
  return (
    <main className="px-8 py-24">
      <p className="t-mono-label text-gold">Mumbai · Maharashtra · Est. MMXXVI</p>
      <h1 className="t-display-xl mt-8">CTLYST</h1>
      <p className="t-lede mt-6 max-w-xl">
        L1 stub. The shell arrives at L2.
      </p>
      <Link href="/harness" className="t-mono-label mt-10 inline-block text-crimson underline">
        Open the harness
      </Link>
    </main>
  );
}
