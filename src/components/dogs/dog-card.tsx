import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, ImageIcon, MapPin, NotebookTabs } from "lucide-react";
import type { PawSummary } from "@/features/paws/queries";

function relativeUpdate(value: string | null) {
  if (!value) return "No updates yet";
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));
}

export function DogCard({ dog }: { dog: PawSummary }) {
  return <article className="group min-w-0 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--paper)] transition duration-300 hover:-translate-y-1 hover:border-[#d9b59e] hover:shadow-[0_18px_45px_rgba(87,53,34,.11)]">
    <Link href={`/paws/${dog.code}`} className="focus-ring block h-full">
      <div className="relative aspect-[16/11] overflow-hidden bg-[var(--primary-soft)] sm:aspect-[4/3]">
        {dog.imageUrl ? <Image src={dog.imageUrl} alt={`${dog.name}${dog.breed ? `, ${dog.breed}` : ""}`} fill sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.035]"/> : <div className="grid h-full place-items-center text-[var(--primary)]"><ImageIcon size={42}/><span className="sr-only">No public photograph available</span></div>}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent"/>
        <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[var(--cocoa)] shadow-sm">Paw ID · {dog.code}</span>
      </div>
      <div className="flex min-h-[190px] flex-col p-4 sm:p-5">
        <div><h3 className="text-[1.65rem] font-bold tracking-[-.045em] text-[var(--charcoal)]">{dog.name}</h3><p className="mt-1 text-sm text-[var(--muted)]">{dog.breed || "Breed unknown"} · {dog.estimatedAge || "Age unknown"}</p></div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--line)] py-3 text-xs text-[var(--muted)]"><span className="flex min-w-0 items-center gap-1.5"><MapPin size={14} className="shrink-0 text-[var(--primary)]"/><span className="truncate">{dog.location}</span></span><span className="flex items-center justify-end gap-1.5"><Clock3 size={14} className="text-[var(--primary)]"/>{relativeUpdate(dog.latestEventAt)}</span></div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]"><NotebookTabs size={15} className="text-[var(--primary)]"/>{dog.eventCount} {dog.eventCount === 1 ? "care update" : "care updates"}</span><span className="flex items-center gap-1 text-sm font-bold text-[var(--primary-hover)]">Open profile <ArrowRight size={16} className="transition group-hover:translate-x-1"/></span></div>
      </div>
    </Link>
  </article>;
}
