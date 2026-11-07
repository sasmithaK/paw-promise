import Link from "next/link";
import { CalendarDays, MapPin, PawPrint, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";

const formatDate=(value:string)=>new Intl.DateTimeFormat("en-LK",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
const label=(value:string)=>value.toLowerCase().replaceAll("_"," ").replace(/^./,first=>first.toUpperCase());

export default async function AuthorisedPawRecordPage({params}:{params:Promise<{dogCode:string}>}) {
  const identity=await requireActiveIdentity();
  const {dogCode}=await params;
  const numericCode=Number(dogCode.replace(/^PP-/i,""));
  if(!Number.isSafeInteger(numericCode)||numericCode<1) notFound();
  const supabase=await createClient();
  const {data:paw,error}=await supabase.from("dogs").select("id,dog_code,name,record_status,created_by,found_location_label,changes_requested_note").eq("dog_code",numericCode).maybeSingle();
  if(error||!paw) notFound();
  const {data:events,error:eventError}=await supabase.from("dog_events").select("id,event_type,title,description,occurred_at,location_label,visibility,verification_status,created_by,event_participants(id),event_attachments(id)").eq("dog_id",paw.id).order("occurred_at",{ascending:false});
  if(eventError) throw new Error(`Unable to load authorised history: ${eventError.message}`);
  const canEdit=paw.record_status==="PENDING"&&paw.created_by===identity.id;
  return <WorkspaceShell><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Authorised paw record · PP-{String(paw.dog_code).padStart(6,"0")}</p><h1 className="page-title mt-3">{paw.name||"Unnamed pup"}</h1><p className="mt-2 text-[var(--muted)]">{paw.found_location_label} · {label(paw.record_status)}</p></div><div className="flex flex-wrap gap-2">{canEdit&&<ButtonLink href={`/dashboard/paws/${dogCode}/edit`} variant="secondary">Edit pending profile</ButtonLink>}{paw.record_status==="PUBLISHED"&&<ButtonLink href={`/dashboard/paws/${dogCode}/events/new`}><Plus size={16}/>Add care update</ButtonLink>}</div></div>{paw.changes_requested_note&&<p className="mt-5 rounded-[12px] bg-[#fff2e9] p-4 text-sm text-[var(--cocoa)]"><strong>Changes requested:</strong> {paw.changes_requested_note}</p>}
    <section className="mt-8"><div className="flex items-end justify-between"><div><p className="eyebrow">Visible to you</p><h2 className="section-title mt-2">Complete authorised history</h2></div>{paw.record_status==="PUBLISHED"&&<Link href={`/paws/PP-${String(paw.dog_code).padStart(6,"0")}`} className="text-sm font-bold text-[var(--primary-hover)]">Public profile</Link>}</div>{events.length?<div className="mt-6 grid gap-4">{events.map(event=><article key={event.id} className="card p-5"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={event.verification_status==="VERIFIED"?"sage":"neutral"}>{label(event.event_type)}</StatusBadge><StatusBadge tone={event.visibility==="PUBLIC"?"sage":"amber"}>{label(event.visibility)}</StatusBadge><span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)]"><CalendarDays size={14}/>{formatDate(event.occurred_at)}</span></div><h3 className="mt-3 text-lg font-bold">{event.title}</h3>{event.description&&<p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.description}</p>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted)]">{event.location_label&&<span className="flex items-center gap-1"><MapPin size={13}/>{event.location_label}</span>}<span>{event.event_participants.length} participant records</span><span>{event.event_attachments.length} private evidence files</span></div></article>)}</div>:<div className="card mt-6 p-8 text-center"><PawPrint className="mx-auto text-[var(--primary)]"/><h3 className="mt-3 font-bold">No history is visible to you yet</h3></div>}</section></WorkspaceShell>;
}
