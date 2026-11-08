import Link from "next/link";
import { CalendarDays, MapPin, PawPrint, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { PawArchiveControls } from "@/components/dogs/paw-archive-controls";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { PawLocationHistory, type PawLocationPoint } from "@/components/maps/paw-location-history";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { getPawDisplayName } from "@/lib/dog-code";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());

export default async function AuthorisedPawRecordPage({ params }: { params: Promise<{ dogCode: string }> }) {
  const identity = await requireActiveIdentity();
  const { dogCode } = await params;
  const numericCode = Number(dogCode.replace(/^PP-/i, ""));
  if (!Number.isSafeInteger(numericCode) || numericCode < 1) notFound();
  const supabase = await createClient();
  const { data: paw, error } = await supabase.from("dogs").select("id,dog_code,name,record_status,created_by,found_location_label,changes_requested_note,archived_at,archived_by,archive_reason,archive_category,previous_record_status,archive_cleanup_pending").eq("dog_code", numericCode).maybeSingle();
  if (error || !paw) notFound();
  const [{ data: events, error: eventError }, { data: locationRows, error: locationError }] = await Promise.all([
    supabase.from("dog_events").select("id,event_type,title,description,occurred_at,location_label,visibility,verification_status,created_by,event_participants(id),event_attachments(id)").eq("dog_id", paw.id).order("occurred_at", { ascending: false }),
    supabase.rpc("get_paw_location_points", { p_dog_id: paw.id }),
  ]);
  if (eventError) throw new Error(`Unable to load authorised history: ${eventError.message}`);
  if (locationError) throw new Error(`Unable to load the member-only location history: ${locationError.message}`);
  const pawCode = `PP-${String(paw.dog_code).padStart(6, "0")}`;
  const pawName = getPawDisplayName(paw.name, pawCode);
  const locationPoints: PawLocationPoint[] = locationRows.map(point => ({
    eventId: point.event_id,
    eventType: point.event_type,
    title: point.title,
    occurredAt: point.occurred_at,
    locationLabel: point.location_label,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracyMeters: point.accuracy_m,
  }));

  const canEdit = paw.record_status === "PENDING" && paw.created_by === identity.id;
  const isSuperAdmin = identity.roles.includes("SUPER_ADMIN");
  const isStaff = isSuperAdmin || identity.roles.includes("MODERATOR");
  const canArchive = isStaff && (isSuperAdmin || paw.created_by !== identity.id);

  return <WorkspaceShell>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Authorised paw record · {pawCode}</p><h1 className="page-title mt-3">{pawName}</h1><p className="mt-2 text-[var(--muted)]">{paw.found_location_label} · {label(paw.record_status)}</p></div>
      <div className="flex flex-wrap gap-2">{canEdit && <ButtonLink href={`/dashboard/paws/${dogCode}/edit`} variant="secondary">Edit pending profile</ButtonLink>}{paw.record_status === "PUBLISHED" && <ButtonLink href={`/dashboard/paws/${dogCode}/events/new`}><Plus size={16}/>Add care update</ButtonLink>}</div>
    </div>

    {paw.changes_requested_note && <p className="mt-5 rounded-[12px] bg-[#fff2e9] p-4 text-sm text-[var(--cocoa)]"><strong>Changes requested:</strong> {paw.changes_requested_note}</p>}
    {paw.record_status === "ARCHIVED" && paw.archived_at && <div className="card mt-5 grid gap-3 p-5 text-sm sm:grid-cols-3"><div><span className="text-xs text-[var(--muted)]">Removed</span><p className="mt-1 font-semibold">{formatDate(paw.archived_at)}</p></div><div><span className="text-xs text-[var(--muted)]">Category</span><p className="mt-1 font-semibold">{label(paw.archive_category || "OTHER")}</p></div><div><span className="text-xs text-[var(--muted)]">Previous state</span><p className="mt-1 font-semibold">{label(paw.previous_record_status || "PENDING")}</p></div>{paw.archive_reason && <div className="sm:col-span-3"><span className="text-xs text-[var(--muted)]">Recorded reason</span><p className="mt-1 leading-6">{paw.archive_reason}</p></div>}</div>}

    {isStaff && <PawArchiveControls dogId={paw.id} pawCode={pawCode} pawName={pawName} archived={paw.record_status === "ARCHIVED"} cleanupPending={paw.archive_cleanup_pending} canArchive={canArchive} canRestore={isSuperAdmin && !paw.archive_cleanup_pending}/>}

    <section className="card mt-8 p-4 sm:p-5"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Member-only map</p><h2 className="mt-2 text-2xl font-bold tracking-[-.035em]">Recorded locations</h2></div><p className="max-w-md text-xs leading-5 text-[var(--muted)]">Exact points are available only to active signed-in Members, Moderators, and Super Admins.</p></div>{locationPoints.length ? <><PawLocationHistory points={locationPoints}/><p className="mt-3 text-xs text-[var(--muted)]">{locationPoints.length} {locationPoints.length === 1 ? "location" : "locations"} recorded. Select a point to see its event and time.</p></> : <div className="grid min-h-44 place-items-center rounded-[12px] border border-dashed border-[var(--line)] bg-[#fff8f2] p-6 text-center"><div><MapPin className="mx-auto text-[var(--primary)]"/><h3 className="mt-3 font-bold">No map points recorded</h3><p className="mt-1 text-sm text-[var(--muted)]">Add a location when creating the next care update.</p></div></div>}</section>

    <section className="mt-8">
      <div className="flex items-end justify-between"><div><p className="eyebrow">Visible to you</p><h2 className="section-title mt-2">Complete authorised history</h2></div>{paw.record_status === "PUBLISHED" && <Link href={`/paws/${pawCode}`} className="text-sm font-bold text-[var(--primary-hover)]">Public profile</Link>}</div>
      {events.length ? <div className="mt-6 grid gap-4">{events.map((event) => <article key={event.id} className="card p-5"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={event.verification_status === "VERIFIED" ? "sage" : "neutral"}>{label(event.event_type)}</StatusBadge><StatusBadge tone={event.visibility === "PUBLIC" ? "sage" : "amber"}>{label(event.visibility)}</StatusBadge><span className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)]"><CalendarDays size={14}/>{formatDate(event.occurred_at)}</span></div><h3 className="mt-3 text-lg font-bold">{event.title}</h3>{event.description && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.description}</p>}<div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted)]">{event.location_label && <span className="flex items-center gap-1"><MapPin size={13}/>{event.location_label}</span>}<span>{event.event_participants.length} participant records</span><span>{event.event_attachments.length} private evidence files</span></div></article>)}</div> : <div className="card mt-6 p-8 text-center"><PawPrint className="mx-auto text-[var(--primary)]"/><h3 className="mt-3 font-bold">No history is visible to you yet</h3></div>}
    </section>
  </WorkspaceShell>;
}
