import { ClipboardCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";

const formatDate=(value:string)=>new Intl.DateTimeFormat("en-LK",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));

export default async function AuditPage(){
  const supabase=await createClient();
  const {data:entries,error}=await supabase.from("audit_logs").select("id,action,entity_type,entity_id,created_at,profiles(full_name)").order("created_at",{ascending:false}).limit(100);
  if(error) throw new Error(`Unable to load audit history: ${error.message}`);
  return <WorkspaceShell admin><div><p className="eyebrow">Accountability</p><h1 className="page-title mt-3">Audit history</h1><p className="mt-3 text-[var(--muted)]">Live, append-only history of privileged and sensitive actions.</p></div>{entries.length?<div className="card mt-7 overflow-hidden">{entries.map(entry=><article key={entry.id} className="grid gap-3 border-b border-[var(--line)] p-5 last:border-0 sm:grid-cols-[48px_1fr_1fr_auto] sm:items-center"><span className="grid size-10 place-items-center rounded-[10px] bg-[var(--sage)] text-[var(--forest)]"><ClipboardCheck size={18}/></span><div><StatusBadge tone="neutral">{entry.action.toUpperCase()}</StatusBadge><p className="mt-2 text-sm font-semibold">{entry.entity_type} · {entry.entity_id?.slice(0,8)||"system"}</p></div><p className="text-sm text-[var(--muted)]">Actor: <strong className="text-[var(--charcoal)]">{entry.profiles?.full_name||"System"}</strong></p><time className="text-xs text-[var(--muted)]">{formatDate(entry.created_at)}</time></article>)}</div>:<div className="card mt-7 p-10 text-center"><ClipboardCheck className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No privileged actions recorded yet</h2></div>}<p className="mt-4 text-xs leading-5 text-[var(--muted)]">Database triggers create these entries automatically. Application roles cannot edit or delete them.</p></WorkspaceShell>;
}
