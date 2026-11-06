import { Activity, Pencil, Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, first => first.toUpperCase());

export default async function ActivitiesPage() {
  const identity = await requireActiveIdentity();
  const canCorrect = identity.roles.some(role => role === "MODERATOR" || role === "SUPER_ADMIN");
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("dog_events").select("id,title,description,event_type,occurred_at,verification_status,dogs(name,dog_code)").order("occurred_at", { ascending: false }).limit(50);
  if (error) throw new Error(`Unable to load activity: ${error.message}`);
  return <WorkspaceShell><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Community record</p><h1 className="page-title mt-2">Activity</h1><p className="mt-2 text-[var(--muted)]">Recent published community updates and your own contributions.</p></div><ButtonLink href="/dashboard/dogs"><Plus size={17}/>Add an update</ButtonLink></div>
    {events.length ? <div className="mt-7 grid gap-3 sm:gap-4">{events.map(event=><article key={event.id} className="card grid min-w-0 gap-3 p-4 sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:p-5"><span className="grid size-10 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary)]"><Activity size={18}/></span><div className="min-w-0"><div className="flex flex-wrap gap-2"><h2 className="font-bold">{event.title}</h2><StatusBadge tone={event.verification_status==="VERIFIED"?"sage":"neutral"}>{label(event.event_type)}</StatusBadge></div>{event.description&&<p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.description}</p>}<p className="mt-3 text-xs font-semibold text-[var(--muted)]">{event.dogs?.name || "Unnamed pup"} · PP-{String(event.dogs?.dog_code ?? 0).padStart(6,"0")}</p></div><div className="grid justify-items-start gap-3 sm:justify-items-end"><time className="text-xs text-[var(--muted)] sm:text-right">{formatDate(event.occurred_at)}</time>{canCorrect && <ButtonLink href={`/activities/${event.id}/correct`} variant="secondary" size="sm"><Pencil size={14}/>Correct</ButtonLink>}</div></article>)}</div> : <div className="card mt-7 p-10 text-center"><Activity className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No care activity yet</h2><p className="mt-2 text-sm text-[var(--muted)]">Updates will appear after a paw is published and members begin recording care.</p></div>}
  </WorkspaceShell>;
}
