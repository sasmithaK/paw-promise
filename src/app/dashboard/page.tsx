import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, PawPrint, Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "Member dashboard" };

export default function DashboardPage() {
  return <WorkspaceShell>
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Thursday, 6 November</p><h1 className="page-title mt-2">Good morning, Nimali.</h1><p className="mt-2 text-[var(--muted)]">Here is what needs your attention today.</p></div>
      <ButtonLink href="/dogs/new"><Plus size={17}/>Introduce a pup</ButtonLink>
    </div>
    <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-5">
      <article className="card flex items-center gap-4 p-4 sm:block sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary)]"><PawPrint size={20}/></span><div className="flex flex-1 items-baseline justify-between sm:mt-4"><div><p className="font-bold">Paws you follow</p><p className="mt-1 text-xs text-[var(--muted)]">2 updated this week</p></div><span className="text-3xl font-bold tracking-[-.05em]">4</span></div></article>
      <article className="card flex items-center gap-4 p-4 sm:block sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f5ead5] text-[#805915]"><CalendarClock size={20}/></span><div className="flex flex-1 items-baseline justify-between sm:mt-4"><div><p className="font-bold">Follow-ups due</p><p className="mt-1 text-xs text-[var(--muted)]">1 is overdue</p></div><span className="text-3xl font-bold tracking-[-.05em]">2</span></div></article>
      <article className="card flex items-center gap-4 p-4 sm:block sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f5ded0] text-[var(--primary)]"><CheckCircle2 size={20}/></span><div className="flex flex-1 items-baseline justify-between sm:mt-4"><div><p className="font-bold">Care updates</p><p className="mt-1 text-xs text-[var(--muted)]">In the last 30 days</p></div><span className="text-3xl font-bold tracking-[-.05em]">7</span></div></article>
    </div>
    <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.4fr_1fr]">
      <section className="card min-w-0 overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--line)] p-5"><div><h2 className="text-xl font-bold">Recent activity</h2><p className="mt-1 text-sm text-[var(--muted)]">Updates from paws you follow</p></div><Link href="/activities" className="text-sm font-bold text-[var(--primary-hover)]">View all</Link></div><div className="divide-y divide-[var(--line)]">{[{name:"Milo",text:"Health observation added",time:"Yesterday, 4:20 PM",tone:"sage" as const},{name:"Nala",text:"Marked ready for adoption",time:"4 Nov, 11:05 AM",tone:"amber" as const},{name:"Kavi",text:"Veterinary visit recorded",time:"2 Nov, 9:40 AM",tone:"neutral" as const}].map(item=><div key={item.name} className="flex min-w-0 items-center gap-3 p-4 sm:px-5"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-bold text-white">{item.name[0]}</span><div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="truncate text-sm text-[var(--muted)]">{item.text}</p></div><div className="shrink-0 text-right"><StatusBadge tone={item.tone}>New</StatusBadge><p className="mt-1 hidden text-xs text-[var(--muted)] sm:block">{item.time}</p></div></div>)}</div></section>
      <section className="card p-5"><h2 className="text-xl font-bold">Next follow-ups</h2><div className="mt-4 space-y-3"><Link href="/follow-ups" className="block rounded-[12px] border border-[var(--line)] p-4 hover:border-[var(--primary)]"><div className="flex justify-between gap-3"><p className="font-bold">Check Milo’s wound</p><StatusBadge tone="red">Overdue</StatusBadge></div><p className="mt-2 text-sm text-[var(--muted)]">Due 5 Nov · Milo</p></Link><Link href="/follow-ups" className="block rounded-[12px] border border-[var(--line)] p-4 hover:border-[var(--primary)]"><div className="flex justify-between gap-3"><p className="font-bold">Vaccination follow-up</p><StatusBadge tone="amber">Tomorrow</StatusBadge></div><p className="mt-2 text-sm text-[var(--muted)]">Due 7 Nov · Kavi</p></Link></div><ButtonLink href="/follow-ups" variant="secondary" className="mt-4 w-full">Manage follow-ups <ArrowRight size={16}/></ButtonLink></section>
    </div>
  </WorkspaceShell>;
}
