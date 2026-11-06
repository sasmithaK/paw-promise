import Link from "next/link";
import { PawPrint } from "lucide-react";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" className="focus-ring group inline-flex items-center gap-2.5 rounded-md" aria-label="Paw Promise home">
    <span className={`grid size-9 place-items-center rounded-full transition-transform duration-200 group-hover:scale-105 shadow-xs ${inverse ? "bg-white text-[var(--forest)]" : "bg-[var(--forest)] text-white"}`}><PawPrint size={19} strokeWidth={2.3} /></span>
    <span className="leading-none"><span className={`block text-[17px] font-bold tracking-[-.03em] transition-colors ${inverse ? "text-white" : "text-[var(--charcoal)] group-hover:text-[var(--primary)]"}`}>Paw Promise</span><span className={`mt-1 block text-[9px] font-semibold uppercase tracking-[.16em] ${inverse ? "text-white/65" : "text-[var(--muted)]"}`}>Leo Club of Tholangamuwa</span></span>
  </Link>;
}
