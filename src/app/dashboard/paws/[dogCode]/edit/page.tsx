import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Button } from "@/components/ui/button";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { updatePendingPawAction } from "@/features/paws/actions";
import { createClient } from "@/lib/supabase/server";

const control = "h-11 w-full rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal";
const localDate = (value: string) => { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0,16); };

export default async function EditPendingPawPage({ params }: { params: Promise<{ dogCode: string }> }) {
  const identity = await requireActiveIdentity();
  const { dogCode } = await params;
  const numericCode = Number(dogCode.replace(/^PP-/i, ""));
  if (!Number.isSafeInteger(numericCode) || numericCode < 1) notFound();
  const supabase = await createClient();
  const { data: paw, error } = await supabase.from("dogs").select("id,name,sex,estimated_age,breed,colour,size,distinguishing_features,found_at,found_location_label,vaccination_status,sterilisation_status,record_status,created_by,changes_requested_note").eq("dog_code", numericCode).maybeSingle();
  if (error || !paw) notFound();
  if (paw.created_by !== identity.id || paw.record_status !== "PENDING") redirect(`/dashboard/paws/${dogCode}`);
  return <WorkspaceShell><div className="mx-auto max-w-3xl"><p className="eyebrow">Pending profile · {dogCode.toUpperCase()}</p><h1 className="page-title mt-3">Update this paw profile</h1><p className="mt-3 text-[var(--muted)]">Changes remain private until an independent moderator publishes the profile.</p>{paw.changes_requested_note&&<div className="mt-5 rounded-[12px] border border-[#e4b79f] bg-[#fff2e9] p-4 text-sm text-[var(--cocoa)]"><strong>Moderator request:</strong> {paw.changes_requested_note}</div>}
    <form action={updatePendingPawAction} className="card mt-7 grid gap-5 p-5 sm:grid-cols-2 sm:p-8"><input type="hidden" name="dogId" value={paw.id}/><Field label="Name"><input name="name" defaultValue={paw.name||""} maxLength={100} className={control}/></Field><Field label="Sex"><select name="sex" defaultValue={paw.sex} className={control}><option value="UNKNOWN">Unknown</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></Field><Field label="Estimated age"><input name="estimatedAge" defaultValue={paw.estimated_age||""} maxLength={80} className={control}/></Field><Field label="Size"><select name="size" defaultValue={paw.size||"UNKNOWN"} className={control}><option value="UNKNOWN">Unknown</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option></select></Field><Field label="Breed or type"><input name="breed" defaultValue={paw.breed||""} maxLength={120} className={control}/></Field><Field label="Colour"><input name="colour" defaultValue={paw.colour||""} maxLength={120} className={control}/></Field><Field label="Found at"><input type="datetime-local" name="foundAt" defaultValue={localDate(paw.found_at)} required className={control}/></Field><Field label="Approximate locality"><input name="foundLocationLabel" defaultValue={paw.found_location_label} required maxLength={200} className={control}/></Field><Field label="Vaccination"><select name="vaccinationStatus" defaultValue={paw.vaccination_status} className={control}><option value="UNKNOWN">Unknown</option><option value="REPORTED">Reported</option><option value="EVIDENCE_ATTACHED">Evidence available</option></select></Field><Field label="Sterilisation"><select name="sterilisationStatus" defaultValue={paw.sterilisation_status} className={control}><option value="UNKNOWN">Unknown</option><option value="REPORTED">Reported</option><option value="EVIDENCE_ATTACHED">Evidence available</option></select></Field><label className="grid gap-2 text-sm font-bold sm:col-span-2">Distinguishing features<textarea name="distinguishingFeatures" defaultValue={paw.distinguishing_features||""} maxLength={1000} className="min-h-28 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal"/></label><div className="flex justify-end sm:col-span-2"><Button type="submit">Save and return to review</Button></div></form></div></WorkspaceShell>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>; }
