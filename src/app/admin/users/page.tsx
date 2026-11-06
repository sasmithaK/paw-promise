import { ShieldCheck, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdminIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));

export default async function UsersPage() {
  await requireSuperAdminIdentity();
  const supabase = await createClient();
  const { data: users, error } = await supabase.from("profiles").select("id,full_name,account_status,created_at,user_roles!user_roles_user_id_fkey(role)").order("created_at");
  if (error) throw new Error(`Unable to load users: ${error.message}`);
  return <WorkspaceShell admin><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Access control</p><h1 className="page-title mt-3">Users</h1><p className="mt-3 text-[var(--muted)]">This page is protected by a server-side Super Admin check. Future role mutations must repeat that check inside their Server Action.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-2 text-sm font-bold text-[var(--primary-hover)]"><ShieldCheck size={17}/>Super Admin only</span></div>
    {users.length ? <div className="card mt-7 overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead className="bg-[#fff5ed] text-xs uppercase tracking-wide text-[var(--muted)]"><tr>{["User","Roles","Status","Joined"].map(header=><th key={header} className="border-b border-[var(--line)] px-5 py-3 font-bold">{header}</th>)}</tr></thead><tbody>{users.map(user=><tr key={user.id} className="border-b border-[var(--line)] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[var(--sage)] text-sm font-bold text-[var(--forest)]">{user.full_name.split(/\s+/).slice(0,2).map(part=>part[0]).join("")}</span><p className="font-bold">{user.full_name}</p></div></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{user.user_roles.map(({role})=><StatusBadge key={role} tone={role==="SUPER_ADMIN"?"amber":role==="MODERATOR"?"sage":"neutral"}>{role}</StatusBadge>)}</div></td><td className="px-5 py-4"><StatusBadge tone={user.account_status==="ACTIVE"?"sage":"red"}>{user.account_status}</StatusBadge></td><td className="px-5 py-4 text-sm text-[var(--muted)]">{formatDate(user.created_at)}</td></tr>)}</tbody></table></div> : <div className="card mt-7 p-10 text-center"><Users className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No member profiles found</h2></div>}
  </WorkspaceShell>;
}
