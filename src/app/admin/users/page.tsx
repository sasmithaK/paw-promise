import { ShieldCheck, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdminIdentity } from "@/features/auth/authorization";
import { setAccountStatusAction, setMemberRoleAction } from "@/features/milestone-five/actions";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));

export default async function UsersPage() {
  const identity = await requireSuperAdminIdentity();
  const supabase = await createClient();
  const { data: users, error } = await supabase.from("profiles").select("id,full_name,account_status,created_at,user_roles!user_roles_user_id_fkey(role)").order("created_at");
  if (error) throw new Error(`Unable to load users: ${error.message}`);

  return <WorkspaceShell admin>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Access control</p><h1 className="page-title mt-3">Users</h1><p className="mt-3 text-[var(--muted)]">Role and account changes require a reason, are enforced by Super Admin-only RPCs, and enter the audit trail.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-2 text-sm font-bold text-[var(--primary-hover)]"><ShieldCheck size={17}/>Super Admin only</span></div>
    {users.length ? <div className="mt-7 grid gap-4">{users.map((user) => {
      const roles = user.user_roles.map((item) => item.role);
      const own = user.id === identity.id;
      return <article key={user.id} className="card grid gap-5 p-5 xl:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)]">
        <div><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[var(--primary-soft)] font-bold text-[var(--primary-hover)]">{user.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span><div><h2 className="font-bold">{user.full_name}</h2><p className="text-xs text-[var(--muted)]">Joined {formatDate(user.created_at)}</p></div></div><div className="mt-4 flex flex-wrap gap-1.5">{roles.map((role) => <StatusBadge key={role} tone={role === "SUPER_ADMIN" ? "amber" : role === "MODERATOR" ? "sage" : "neutral"}>{role}</StatusBadge>)}<StatusBadge tone={user.account_status === "ACTIVE" ? "sage" : "red"}>{user.account_status}</StatusBadge></div>{own && <p className="mt-3 text-xs text-[var(--muted)]">Your own privileges cannot be changed here.</p>}</div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ActionFeedbackForm action={setAccountStatusAction} submitLabel="Update status" pendingLabel="Updating…" variant="secondary" disabled={own} className="grid gap-2 rounded-[12px] bg-[#fff8f2] p-3"><input type="hidden" name="userId" value={user.id}/><label className="grid gap-1 text-xs font-bold">Account status<select name="status" defaultValue={user.account_status} disabled={own} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm font-normal"><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DISABLED">Disabled</option></select></label><input name="reason" required disabled={own} maxLength={500} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm" placeholder="Required reason"/></ActionFeedbackForm>
          <ActionFeedbackForm action={setMemberRoleAction} submitLabel="Update role" pendingLabel="Updating…" disabled={own} className="grid gap-2 rounded-[12px] bg-[#fff8f2] p-3"><input type="hidden" name="userId" value={user.id}/><label className="grid gap-1 text-xs font-bold">Privileged role<select name="role" disabled={own} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm font-normal"><option value="MODERATOR">Moderator</option><option value="SUPER_ADMIN">Super Admin</option></select></label><label className="grid gap-1 text-xs font-bold">Action<select name="enabled" disabled={own} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm font-normal"><option value="true">Grant role</option><option value="false">Revoke role</option></select></label><input name="reason" required disabled={own} maxLength={500} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 text-sm" placeholder="Required reason"/></ActionFeedbackForm>
        </div>
      </article>;
    })}</div> : <div className="card mt-7 p-10 text-center"><Users className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No member profiles found</h2></div>}
  </WorkspaceShell>;
}
