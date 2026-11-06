"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, ClipboardCheck, Dog, LayoutDashboard, ListTodo, LogOut, Menu, PawPrint, Plus, Settings, ShieldCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceIdentity } from "@/components/auth/workspace-identity";
import { Brand } from "./brand";
import { ButtonLink } from "../ui/button";

const memberLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/dogs", label: "Paw profiles", icon: Dog },
  { href: "/activities", label: "Activity", icon: Activity },
  { href: "/follow-ups", label: "Follow-ups", icon: ListTodo },
];
const adminLinks = [
  { href: "/admin", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit history", icon: ClipboardCheck },
];

export function WorkspaceShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const identity = useWorkspaceIdentity();
  const links = admin ? adminLinks.filter(link => link.href !== "/admin/users" || identity?.roles.includes("SUPER_ADMIN")) : memberLinks;
  const displayName = identity?.fullName ?? "Community member";
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "PP";
  const roleLabel = identity?.roles.includes("SUPER_ADMIN") ? "Super Admin" : identity?.roles.includes("MODERATOR") ? "Moderator" : "Member";
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return <div className="min-h-screen bg-[#f6ede4] lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="hidden border-r border-[var(--line)] bg-[var(--paper)] lg:flex lg:flex-col">
      <div className="px-6 py-7"><Brand /></div><nav className="mt-3 grid gap-1 px-3" aria-label={admin ? "Administration" : "Member workspace"}>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("focus-ring flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold", pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? "bg-[var(--primary-soft)] text-[var(--primary-hover)]" : "text-[var(--muted)] hover:bg-[#f8eee6] hover:text-[var(--charcoal)]")}><Icon size={19} />{label}</Link>)}</nav>
      <div className="mt-auto border-t border-[var(--line)] p-4"><button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[#f8eee6]"><LogOut size={18}/>Sign out</button><div className="mt-3 flex items-center gap-3 rounded-[12px] bg-[#f8eee6] p-3"><span className="grid size-9 place-items-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="text-xs text-[var(--muted)]">{roleLabel}</p></div><Settings className="ml-auto" size={17}/></div></div>
    </aside>
    <div className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-[var(--line)] bg-[var(--paper)]/95 px-3 backdrop-blur-sm sm:h-17 sm:gap-4 sm:px-7"><button className="focus-ring rounded p-2 lg:hidden" aria-label={menuOpen ? "Close workspace menu" : "Open workspace menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button><div className="flex min-w-0 items-center gap-2 lg:hidden"><PawPrint className="shrink-0 text-[var(--primary)]"/><span className="hidden font-bold sm:inline">Paw Promise</span></div><span className="ml-auto hidden rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-hover)] sm:inline">{roleLabel} workspace</span><button className="focus-ring relative rounded p-2" aria-label="Notifications"><Bell size={20}/><span className="absolute right-1 top-1 size-2 rounded-full bg-[var(--primary)]"/></button>{!admin && <ButtonLink href="/dogs/new" size="sm"><Plus size={16}/><span className="hidden sm:inline">Introduce a pup</span><span className="sm:hidden">New pup</span></ButtonLink>}</header>
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={()=>setMenuOpen(false)}><aside className="flex h-full w-[min(86vw,320px)] flex-col bg-[var(--paper)] shadow-xl" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between border-b border-[var(--line)] p-5"><Brand/><button className="rounded p-2" onClick={()=>setMenuOpen(false)} aria-label="Close workspace menu"><X/></button></div><nav className="grid gap-1 p-3" aria-label={admin ? "Mobile administration" : "Mobile member workspace"}>{links.map(({ href, label, icon: Icon })=><Link key={href} href={href} onClick={()=>setMenuOpen(false)} className={cn("flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold", pathname===href?"bg-[var(--primary-soft)] text-[var(--primary-hover)]":"text-[var(--muted)] hover:bg-[#f8eee6]")}><Icon size={19}/>{label}</Link>)}</nav><div className="mt-auto border-t border-[var(--line)] p-4"><div className="flex items-center gap-3 rounded-[12px] bg-[#f8eee6] p-3"><span className="grid size-9 place-items-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="text-xs text-[var(--muted)]">{roleLabel}</p></div></div><button type="button" onClick={signOut} className="mt-2 flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--muted)]"><LogOut size={17}/>Sign out</button></div></aside></div>}
      <main className="px-3 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">{children}</main></div>
  </div>;
}
