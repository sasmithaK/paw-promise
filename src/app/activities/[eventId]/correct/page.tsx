import { notFound } from "next/navigation";
import { EventCorrectionForm } from "@/components/dogs/event-correction-form";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireModeratorIdentity } from "@/features/auth/authorization";
import { getPawDisplayName } from "@/lib/dog-code";
import { createClient } from "@/lib/supabase/server";

export default async function CorrectEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireModeratorIdentity();
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: event, error } = await supabase.from("dog_events").select("id,title,description,occurred_at,location_label,visibility,verification_status,event_type,dogs(name,dog_code)").eq("id", eventId).maybeSingle();
  if (error) throw new Error(`Unable to load this event: ${error.message}`);
  if (!event) notFound();
  const pawCode = `PP-${String(event.dogs?.dog_code ?? 0).padStart(6, "0")}`;
  const pawName = getPawDisplayName(event.dogs?.name, pawCode);
  return <WorkspaceShell admin><div className="mx-auto max-w-3xl"><p className="eyebrow">Moderator correction · {event.event_type.toLowerCase().replaceAll("_", " ")}</p><h1 className="page-title mt-2">Correct {pawName}’s event</h1><p className="mt-2 text-sm text-[var(--muted)]">Paw ID · {pawCode}</p><EventCorrectionForm event={{ id: event.id, title: event.title, description: event.description, occurredAt: event.occurred_at, locationLabel: event.location_label, visibility: event.visibility, verificationStatus: event.verification_status }}/></div></WorkspaceShell>;
}
