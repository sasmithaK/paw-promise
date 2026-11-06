import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, Flag, MessageSquareText } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPendingPawsForModeration } from "@/features/paws/queries";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle:"medium",timeStyle:"short" }).format(new Date(value));

export default async function AdminPage() {
  const supabase=await createClient();
  const [pending, reports, changes, reviewed, queue] = await Promise.all([
    supabase.from("dogs").select("id",{count:"exact",head:true}).eq("record_status","PENDING"),
    supabase.from("reports").select("id",{count:"exact",head:true}).in("status",["OPEN","UNDER_REVIEW"]),
    supabase.from("dogs").select("id",{count:"exact",head:true}).not("changes_requested_at","is",null),
    supabase.from("audit_logs").select("id",{count:"exact",head:true}),
    getPendingPawsForModeration(),
  ]);
  if(pending.error||reports.error||changes.error||reviewed.error) throw new Error("Moderation metrics could not be loaded.");
  return <WorkspaceShell admin><div><p className="eyebrow">Administration</p><h1 className="page-title mt-2">Moderation overview</h1><p className="mt-2 text-[var(--muted)]">Live review and accountability data from the development database.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5"><Metric icon={<Clock3/>} value={pending.count??0} label="Pending paw profiles"/><Metric icon={<Flag/>} value={reports.count??0} label="Open reports"/><Metric icon={<MessageSquareText/>} value={changes.count??0} label="Change requests"/><Metric icon={<ClipboardCheck/>} value={reviewed.count??0} label="Audited actions"/></div>
    <section className="card mt-5 overflow-hidden"><div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-5"><div><h2 className="text-xl font-bold">Pending profiles</h2><p className="mt-1 text-sm text-[var(--muted)]">Oldest submissions appear first.</p></div><Link href="/admin/moderation" className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--primary-hover)]">Full queue <ArrowRight size={16}/></Link></div>{queue.length?<div className="divide-y divide-[var(--line)]">{queue.slice(0,5).map(item=><Link key={item.id} href="/admin/moderation" className="grid gap-2 p-4 hover:bg-[#fff7f0] sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center sm:gap-3 sm:p-5"><div><p className="font-bold">{item.name}</p><p className="text-xs text-[var(--muted)]">Paw ID · {item.code}</p></div><p className="text-sm text-[var(--muted)]">{item.submittedBy}</p><p className="text-sm text-[var(--muted)]">{formatDate(item.submittedAt)}</p><StatusBadge tone={item.changesRequestedNote?"red":"amber"}>{item.changesRequestedNote?"Changes requested":"Pending"}</StatusBadge></Link>)}</div>:<p className="p-6 text-sm text-[var(--muted)]">No profiles are awaiting review.</p>}</section>
    <section className="mt-5 grid gap-5 lg:grid-cols-2"><div className="card p-5"><ClipboardCheck className="text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">Review principles</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]"><li>• Do not approve your own submission.</li><li>• Protect exact locations and personal information.</li><li>• Separate observations from verified clinical information.</li><li>• Add a clear note when requesting changes.</li></ul></div><div className="card p-5"><h2 className="text-xl font-bold">Audit enforcement is active</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Moderation, role, account-status, report, and event-correction changes create append-only database audit entries automatically.</p><Link href="/admin/audit" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--primary-hover)]">Open audit history <ArrowRight size={16}/></Link></div></section>
  </WorkspaceShell>;
}

function Metric({icon,value,label}:{icon:React.ReactNode;value:number;label:string}){return <article className="card p-5"><span className="text-[var(--primary)]">{icon}</span><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-[var(--muted)]">{label}</p></article>}
