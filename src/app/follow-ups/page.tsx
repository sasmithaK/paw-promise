import { CalendarDays, Clock3 } from "lucide-react";
import { FollowUpForm } from "@/components/follow-ups/follow-up-form";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { updateFollowUpStatusAction } from "@/features/milestone-five/actions";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function FollowUpsPage() {
  const identity = await requireActiveIdentity();
  const isStaff = identity.roles.some((role) => role === "MODERATOR" || role === "SUPER_ADMIN");
  const supabase = await createClient();
  const [taskResult, pawResult, memberResult] = await Promise.all([
    supabase.from("follow_ups").select("id,title,description,due_at,status,assigned_to,created_by,dogs(name,dog_code)").order("due_at", { ascending: true }),
    supabase.from("dogs").select("id,name,dog_code").eq("record_status", "PUBLISHED").order("dog_code"),
    isStaff ? supabase.from("profiles").select("id,full_name").eq("account_status", "ACTIVE").order("full_name") : Promise.resolve({ data: [{ id: identity.id, full_name: identity.fullName }], error: null }),
  ]);
  if (taskResult.error || pawResult.error || memberResult.error) throw new Error("Follow-up data could not be loaded.");
  const tasks = taskResult.data || [];
  const paws = (pawResult.data || []).map((paw) => ({ id: paw.id, label: `PP-${String(paw.dog_code).padStart(6, "0")} · ${paw.name || "Unnamed pup"}` }));
  const members = (memberResult.data || []).map((member) => ({ id: member.id, label: member.full_name }));

  return <WorkspaceShell>
    <div><p className="eyebrow">Care coordination</p><h1 className="page-title mt-3">Follow-ups</h1><p className="mt-3 text-[var(--muted)]">Tasks assigned to you, created by you, or visible through moderation.</p></div>
    <FollowUpForm paws={paws} members={members} currentUserId={identity.id}/>
    {tasks.length ? <div className="mt-7 grid gap-4">{tasks.map((task) => {
      const overdue = Boolean(task.due_at && new Date(task.due_at) < new Date() && !["COMPLETED", "CANCELLED"].includes(task.status));
      return <article key={task.id} className="card flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        <span className={`grid size-11 shrink-0 place-items-center rounded-[10px] ${overdue ? "bg-[#f4e1dc] text-[var(--terracotta)]" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}>{overdue ? <Clock3/> : <CalendarDays/>}</span>
        <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{task.title}</h2><StatusBadge tone={overdue ? "red" : task.status === "COMPLETED" ? "sage" : "amber"}>{task.status.replaceAll("_", " ")}</StatusBadge></div><p className="mt-1 text-sm text-[var(--muted)]">{task.dogs?.name || "Unnamed pup"} · PP-{String(task.dogs?.dog_code ?? 0).padStart(6, "0")} · {task.due_at ? formatDate(task.due_at) : "No due date"}</p>{task.description && <p className="mt-2 text-sm text-[var(--muted)]">{task.description}</p>}</div>
        <ActionFeedbackForm action={updateFollowUpStatusAction} submitLabel="Update" pendingLabel="Updating…" variant="secondary" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="followUpId" value={task.id}/><select name="status" defaultValue={task.status} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm"><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select>
        </ActionFeedbackForm>
      </article>;
    })}</div> : <div className="card mt-7 p-10 text-center"><CalendarDays className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No follow-ups yet</h2><p className="mt-2 text-sm text-[var(--muted)]">Create the first task above when a pup needs another care action.</p></div>}
  </WorkspaceShell>;
}
