import { CalendarDays, Clock3 } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";

const formatDate=(value:string)=>new Intl.DateTimeFormat("en-LK",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));

export default async function FollowUpsPage(){
  const supabase=await createClient();
  const {data:tasks,error}=await supabase.from("follow_ups").select("id,title,description,due_at,status,dogs(name,dog_code)").order("due_at",{ascending:true});
  if(error) throw new Error(`Unable to load follow-ups: ${error.message}`);
  return <WorkspaceShell><div><p className="eyebrow">Care coordination</p><h1 className="page-title mt-3">Follow-ups</h1><p className="mt-3 text-[var(--muted)]">Tasks assigned to you, created by you, or visible through moderation.</p></div>{tasks.length?<div className="mt-7 grid gap-4">{tasks.map(task=>{const overdue=task.due_at&&new Date(task.due_at)<new Date()&&task.status!=="COMPLETED";return <article key={task.id} className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center"><span className={`grid size-11 shrink-0 place-items-center rounded-[10px] ${overdue?"bg-[#f4e1dc] text-[var(--terracotta)]":"bg-[var(--sage)] text-[var(--forest)]"}`}>{overdue?<Clock3/>:<CalendarDays/>}</span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{task.title}</h2><StatusBadge tone={overdue?"red":task.status==="COMPLETED"?"sage":"amber"}>{task.status}</StatusBadge></div><p className="mt-1 text-sm text-[var(--muted)]">{task.dogs?.name||"Unnamed pup"} · PP-{String(task.dogs?.dog_code??0).padStart(6,"0")} · {task.due_at?formatDate(task.due_at):"No due date"}</p>{task.description&&<p className="mt-2 text-sm text-[var(--muted)]">{task.description}</p>}</div></article>})}</div>:<div className="card mt-7 p-10 text-center"><CalendarDays className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No follow-ups yet</h2><p className="mt-2 text-sm text-[var(--muted)]">Follow-up creation is a later milestone; assigned tasks will appear here automatically.</p></div>}</WorkspaceShell>;
}
