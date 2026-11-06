import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, NotebookTabs } from "lucide-react";
import type { Dog } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";

export function DogCard({ dog }: { dog: Dog }) {
  const tone = dog.status === "Receiving treatment" ? "amber" : "sage";
  return <article className="group min-w-0 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--paper)] transition duration-300 hover:-translate-y-1 hover:border-[#d9b59e] hover:shadow-[0_18px_45px_rgba(87,53,34,.11)]">
    <Link href={`/dogs/${dog.code}`} className="focus-ring block h-full">
      <div className="relative aspect-[16/11] overflow-hidden bg-[var(--primary-soft)] sm:aspect-[4/3]">
        <Image src={dog.image} alt={`${dog.name}, ${dog.breed}`} fill sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent"/>
        <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[var(--cocoa)] shadow-sm backdrop-blur-sm">Paw ID · {dog.code}</span>
        <div className="absolute bottom-3 left-3"><StatusBadge tone={tone}>{dog.status}</StatusBadge></div>
      </div>
      <div className="flex min-h-[202px] flex-col p-4 sm:p-5">
        <div><h3 className="text-[1.65rem] font-bold tracking-[-.045em] text-[var(--charcoal)]">{dog.name}</h3><p className="mt-1 text-sm text-[var(--muted)]">{dog.breed} · {dog.age}</p></div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-3 text-xs text-[var(--muted)]"><span className="flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-[var(--primary)]"/><span className="truncate">{dog.location}</span></span><span className="flex items-center justify-end gap-1.5"><Clock3 size={14} className="text-[var(--primary)]"/>{dog.lastSeen}</span></div>
        <div className="mt-auto flex items-center justify-between pt-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]"><NotebookTabs size={15} className="text-[var(--primary)]"/>{dog.updates} care updates</span><span className="flex items-center gap-1 text-sm font-bold text-[var(--primary-hover)]">Open profile <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span></div>
      </div>
    </Link>
  </article>;
}
