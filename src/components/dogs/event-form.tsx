"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Droplets, FileUp, MapPin, Plus, Trash2, Users } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { createPawEventAction } from "@/features/paws/actions";

type EventType = "FEEDING" | "SIGHTING" | "HEALTH_OBSERVATION" | "VETERINARY_VISIT" | "VACCINATION" | "STERILISATION" | "RESCUE" | "GENERAL_UPDATE";
type Draft = {
  eventType: EventType; occurredAt: string; title: string; description: string;
  locationLabel: string; visibility: "PUBLIC" | "MEMBERS" | "PRIVATE";
  foodType: string; quantity: string; quantityUnit: "g" | "kg" | "portion"; waterProvided: boolean;
  observedSigns: string; bodyArea: string; observedCondition: string; directionOfTravel: string;
  providerName: string; visitOutcome: string; nextDueAt: string; vaccineName: string; dose: string;
  procedureStatus: "COMPLETED" | "SCHEDULED" | "UNKNOWN"; rescueOutcome: string; destination: string; category: string;
};
type Participant = { name: string; context: string };

const controlClass = "h-11 w-full rounded-[10px] border border-[var(--line)] bg-white px-3";
const textAreaClass = "min-h-28 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal";
function localDateTime() { const date = new Date(); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); }
function isoOrEmpty(value: string) { return value ? new Date(value).toISOString() : ""; }

export function EventForm({ dogId, pawCode, pawName }: { dogId: string; pawCode: string; pawName: string }) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { register, handleSubmit, control: formControl } = useForm<Draft>({
    defaultValues: {
      eventType: "FEEDING", occurredAt: localDateTime(), visibility: "PUBLIC", waterProvided: false,
      quantityUnit: "g", procedureStatus: "UNKNOWN",
    },
  });
  const eventType = useWatch({ control: formControl, name: "eventType" });

  function updateParticipant(index: number, field: keyof Participant, value: string) {
    setParticipants(current => current.map((participant, participantIndex) => participantIndex === index ? { ...participant, [field]: value } : participant));
  }

  async function submit(value: Draft) {
    setPending(true);
    setMessage(null);
    let details: Record<string, unknown>;
    switch (value.eventType) {
      case "FEEDING": details = { foodType: value.foodType, quantity: value.quantity ? Number(value.quantity) : undefined, quantityUnit: value.quantity ? value.quantityUnit : undefined, waterProvided: value.waterProvided }; break;
      case "SIGHTING": details = { observedCondition: value.observedCondition || undefined, directionOfTravel: value.directionOfTravel || undefined }; break;
      case "HEALTH_OBSERVATION": details = { observedSigns: value.observedSigns.split(",").map(item => item.trim()).filter(Boolean), bodyArea: value.bodyArea || undefined, professionalDiagnosis: false }; break;
      case "VETERINARY_VISIT": details = { providerName: value.providerName, visitOutcome: value.visitOutcome || undefined, nextDueAt: isoOrEmpty(value.nextDueAt) }; break;
      case "VACCINATION": details = { vaccineName: value.vaccineName, dose: value.dose || undefined, nextDueAt: isoOrEmpty(value.nextDueAt) }; break;
      case "STERILISATION": details = { procedureStatus: value.procedureStatus, providerName: value.providerName || undefined }; break;
      case "RESCUE": details = { outcome: value.rescueOutcome, destination: value.destination || undefined }; break;
      default: details = { category: value.category || undefined };
    }

    const payload = new FormData();
    payload.set("dogId", dogId);
    payload.set("eventType", value.eventType);
    payload.set("title", value.title);
    payload.set("description", value.description || "");
    payload.set("occurredAt", new Date(value.occurredAt).toISOString());
    payload.set("locationLabel", value.locationLabel || "");
    payload.set("visibility", value.visibility);
    payload.set("details", JSON.stringify(details));
    payload.set("participants", JSON.stringify(participants.filter(participant => participant.name.trim())));
    attachments.forEach(file => payload.append("attachments", file));
    const result = await createPawEventAction(payload);
    setPending(false);
    if (!result.ok) { setMessage(result.message); return; }
    setSaved(true);
  }

  if (saved) return <div className="card mx-auto max-w-2xl p-10 text-center"><CheckCircle2 className="mx-auto text-[var(--primary)]" size={45}/><h1 className="mt-5 text-3xl font-bold tracking-[-.04em]">Update added to {pawName}’s history</h1><p className="mt-3 text-[var(--muted)]">The update, participants, and private evidence are now part of the append-only care record.</p><ButtonLink href={`/dogs/${pawCode}`} className="mt-7">View timeline</ButtonLink></div>;

  return <div className="mx-auto max-w-3xl"><p className="eyebrow">{pawName} · {pawCode}</p><h1 className="page-title mt-3">Add a care update</h1><p className="mt-3 text-[var(--muted)]">Your authenticated account is recorded as the contributor. Evidence remains private unless a later moderation workflow explicitly approves it.</p>
    <form onSubmit={handleSubmit(submit)} className="card mt-8 grid gap-6 p-5 sm:p-8">
      <label className="grid gap-2 text-sm font-bold">Type of update<select {...register("eventType")} className={controlClass}><option value="FEEDING">Feeding</option><option value="SIGHTING">Sighting</option><option value="HEALTH_OBSERVATION">Health observation</option><option value="VETERINARY_VISIT">Veterinary visit</option><option value="VACCINATION">Vaccination</option><option value="STERILISATION">Sterilisation</option><option value="RESCUE">Rescue</option><option value="GENERAL_UPDATE">General update</option></select></label>
      <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Date and time<input type="datetime-local" max={localDateTime()} {...register("occurredAt", { required: true })} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Visibility<select {...register("visibility")} className={controlClass}><option value="PUBLIC">Public on the profile</option><option value="MEMBERS">Contributor and moderators</option><option value="PRIVATE">Private to contributor and moderators</option></select></label></div>
      <label className="grid gap-2 text-sm font-bold">Title<input {...register("title", { required: true, maxLength: 160 })} className={controlClass} placeholder="Evening meal and fresh water"/></label>
      <label className="grid gap-2 text-sm font-bold">Description<textarea {...register("description")} className={textAreaClass} placeholder="Describe what happened. Record observations rather than a diagnosis."/></label>

      {eventType === "FEEDING" && <fieldset className="grid gap-5 rounded-[12px] bg-[var(--primary-soft)] p-4 sm:grid-cols-2"><legend className="sr-only">Feeding details</legend><label className="grid gap-2 text-sm font-bold">Food provided<input {...register("foodType", { required: true })} className={controlClass} placeholder="Rice and chicken"/></label><div className="grid grid-cols-[1fr_110px] gap-2"><label className="grid gap-2 text-sm font-bold">Quantity<input type="number" min="0" step="any" {...register("quantity")} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Unit<select {...register("quantityUnit")} className={controlClass}><option value="g">g</option><option value="kg">kg</option><option value="portion">Portion</option></select></label></div><label className="flex items-center gap-3 rounded-[10px] bg-white p-3 text-sm font-bold sm:col-span-2"><input type="checkbox" {...register("waterProvided")} className="accent-[var(--primary)]"/><Droplets size={17} className="text-[var(--primary)]"/>Fresh water provided</label></fieldset>}
      {eventType === "SIGHTING" && <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Observed condition<input {...register("observedCondition")} className={controlClass} placeholder="Alert and walking normally"/></label><label className="grid gap-2 text-sm font-bold">Direction of travel<input {...register("directionOfTravel")} className={controlClass} placeholder="Toward the temple road"/></label></div>}
      {eventType === "HEALTH_OBSERVATION" && <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Observed signs<span className="text-xs font-normal text-[var(--muted)]">Separate observations with commas.</span><input {...register("observedSigns", { required: true })} className={controlClass} placeholder="Limping, low appetite"/></label><label className="grid gap-2 text-sm font-bold">Body area<input {...register("bodyArea")} className={controlClass} placeholder="Left front leg"/></label></div>}
      {eventType === "VETERINARY_VISIT" && <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Clinic or provider<input {...register("providerName", { required: true })} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Next due date<input type="datetime-local" {...register("nextDueAt")} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Visit outcome<textarea {...register("visitOutcome")} className={textAreaClass}/></label></div>}
      {eventType === "VACCINATION" && <div className="grid gap-5 sm:grid-cols-3"><label className="grid gap-2 text-sm font-bold">Vaccine<input {...register("vaccineName", { required: true })} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Dose<input {...register("dose")} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Next due date<input type="datetime-local" {...register("nextDueAt")} className={controlClass}/></label></div>}
      {eventType === "STERILISATION" && <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Procedure status<select {...register("procedureStatus")} className={controlClass}><option value="UNKNOWN">Unknown</option><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option></select></label><label className="grid gap-2 text-sm font-bold">Clinic or provider<input {...register("providerName")} className={controlClass}/></label></div>}
      {eventType === "RESCUE" && <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Rescue outcome<input {...register("rescueOutcome", { required: true })} className={controlClass} placeholder="Moved safely from the road"/></label><label className="grid gap-2 text-sm font-bold">Destination<input {...register("destination")} className={controlClass} placeholder="Temporary foster home"/></label></div>}
      {eventType === "GENERAL_UPDATE" && <label className="grid gap-2 text-sm font-bold">Update category<input {...register("category")} className={controlClass} placeholder="Behaviour, shelter, identification…"/></label>}

      <label className="grid gap-2 text-sm font-bold">Approximate location<span className="text-xs font-normal text-[var(--muted)]">Optional; never enter a private address.</span><span className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]" size={17}/><input {...register("locationLabel")} className={`${controlClass} pl-10`} placeholder="Tholangamuwa area"/></span></label>

      <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5"><legend className="flex items-center gap-2 text-sm font-bold"><Users size={17}/>Other people present</legend><p className="text-xs leading-5 text-[var(--muted)]">Names are restricted to the contributor and moderators. Add someone only with their permission.</p>{participants.map((participant, index) => <div key={index} className="grid gap-2 rounded-[10px] bg-[#f8eee6] p-3 sm:grid-cols-[1fr_1fr_auto]"><input aria-label={`Participant ${index + 1} name`} value={participant.name} onChange={event => updateParticipant(index, "name", event.target.value)} className={controlClass} placeholder="Name"/><input aria-label={`Participant ${index + 1} context`} value={participant.context} onChange={event => updateParticipant(index, "context", event.target.value)} className={controlClass} placeholder="Volunteer, local resident…"/><button type="button" onClick={() => setParticipants(current => current.filter((_, participantIndex) => participantIndex !== index))} className="focus-ring grid size-11 place-items-center rounded-[10px] text-[var(--muted)] hover:bg-white" aria-label={`Remove participant ${index + 1}`}><Trash2 size={17}/></button></div>)}<button type="button" onClick={() => setParticipants(current => [...current, { name: "", context: "" }])} className="focus-ring flex w-fit items-center gap-2 text-sm font-bold text-[var(--primary-hover)]"><Plus size={16}/>Add participant</button></fieldset>

      <label className="grid gap-2 border-t border-[var(--line)] pt-5 text-sm font-bold"><span className="flex items-center gap-2"><FileUp size={17}/>Private evidence</span><span className="text-xs font-normal leading-5 text-[var(--muted)]">Up to 5 JPEG, PNG, WebP, or PDF files; 15 MB each. Files remain private and cannot be removed after they are attached to the history.</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setAttachments(Array.from(event.target.files || []).slice(0, 5))} className="rounded-[10px] border border-dashed border-[var(--line)] bg-white p-3 font-normal"/>{attachments.length > 0 && <span aria-live="polite" className="text-xs font-normal text-[var(--muted)]">{attachments.map(file => file.name).join(", ")}</span>}</label>

      <div className="rounded-[10px] bg-[#f5ead5] p-4 text-sm leading-6 text-[#684b1a]"><strong>Append-only history:</strong> this creates a new event. Corrections require a moderator, a reason, and are preserved in the change log.</div>
      {message && <p role="alert" className="rounded-[10px] bg-[#fff2e9] p-3 text-sm text-[var(--cocoa)]">{message}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Securing update…" : "Add to history"}</Button></div>
    </form>
  </div>;
}
