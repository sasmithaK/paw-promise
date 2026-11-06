import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { dogs } from "@/lib/mock-data";

export default function ManagedDogsPage() {
  return <WorkspaceShell>
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Paw records</p><h1 className="page-title mt-2">Your paw profiles</h1><p className="mt-2 text-[var(--muted)]">Profiles you introduced or currently follow.</p></div><ButtonLink href="/dogs/new"><Plus size={17}/>Introduce a pup</ButtonLink></div>
    <div className="relative mt-7 max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]" size={18}/><input className="h-11 w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] pl-10 pr-4" placeholder="Search your paw profiles…" aria-label="Search your paw profiles"/></div>
    <div className="card mt-5 overflow-hidden"><div className="hidden grid-cols-[2fr_1fr_1fr_120px_40px] gap-4 border-b border-[var(--line)] bg-[#fff5ed] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)] md:grid"><span>Paw profile</span><span>Your connection</span><span>Last update</span><span>Status</span><span/></div>{dogs.slice(0,4).map((pup,index)=><Link key={pup.code} href={`/dogs/${pup.code}`} className="grid gap-3 border-b border-[var(--line)] p-4 last:border-0 hover:bg-[#fff7f0] md:grid-cols-[2fr_1fr_1fr_120px_40px] md:items-center md:gap-4 md:p-5"><div className="flex min-w-0 items-center gap-3"><span className="relative size-14 shrink-0 overflow-hidden rounded-[10px]"><Image src={pup.image} alt="" fill sizes="56px" className="object-cover"/></span><div className="min-w-0"><p className="truncate font-bold">{pup.name}</p><p className="text-xs text-[var(--muted)]">Paw ID · {pup.code}</p></div></div><div className="flex items-center justify-between gap-3 md:block"><span className="text-xs text-[var(--muted)] md:hidden">Connection</span><p className="text-sm font-semibold md:font-normal md:text-[var(--muted)]">{index===0?"Introduced by you":"Following"}</p></div><div className="flex items-center justify-between gap-3 md:block"><span className="text-xs text-[var(--muted)] md:hidden">Last update</span><p className="text-sm text-[var(--muted)]">{pup.lastSeen}</p></div><div className="flex items-center justify-between md:block"><span className="text-xs text-[var(--muted)] md:hidden">Status</span><StatusBadge tone={index===0?"amber":"sage"}>{index===0?"Pending":"Published"}</StatusBadge></div><MoreHorizontal className="hidden md:block" size={18}/></Link>)}</div>
  </WorkspaceShell>;
}
