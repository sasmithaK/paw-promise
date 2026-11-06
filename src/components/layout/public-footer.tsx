import Link from "next/link";
import { Brand } from "./brand";

export function PublicFooter() {
  return <footer className="mt-12 bg-[var(--cocoa)] py-12 text-white sm:mt-16">
    <div className="container-shell grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
      <div><Brand inverse /><p className="mt-5 max-w-sm text-sm leading-6 text-white/70">A shared, accountable record of community care for pups in and around Tholangamuwa.</p></div>
      <div><p className="text-sm font-bold">Explore</p><div className="mt-4 grid gap-3 text-sm text-white/70"><Link href="/paws">Paw directory</Link><Link href="/about">About Paw Promise</Link><Link href="/register">Become a member</Link></div></div>
      <div><p className="text-sm font-bold">Transparency</p><p className="mt-4 text-sm leading-6 text-white/70">This interface preview uses illustrative records and photography. No sample record represents a real Paw Promise case.</p></div>
    </div>
    <div className="container-shell mt-12 border-t border-white/15 pt-6 text-xs text-white/50">© 2026 Leo Club of Tholangamuwa · Community care, recorded with respect.</div>
  </footer>;
}
