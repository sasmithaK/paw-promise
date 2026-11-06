"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Droplets, MapPin } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { createPawEventAction } from "@/features/paws/actions";

type EventType = "FEEDING" | "SIGHTING" | "HEALTH_OBSERVATION" | "VETERINARY_VISIT" | "VACCINATION" | "STERILISATION" | "RESCUE" | "GENERAL_UPDATE";
type Draft = { eventType: EventType; occurredAt: string; title: string; description: string; locationLabel: string; foodType: string; waterProvided: boolean; observedSigns: string; visibility: "PUBLIC" | "MEMBERS" | "PRIVATE" };
const controlClass = "h-11 rounded-[10px] border border-[var(--line)] bg-white px-3";

function localDateTime() { const date = new Date(); date.setMinutes(date.getMinutes()-date.getTimezoneOffset()); return date.toISOString().slice(0,16); }

export function EventForm({ dogId, pawCode, pawName }: { dogId: string; pawCode: string; pawName: string }) {
  const [saved,setSaved]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  const [pending,setPending]=useState(false);
  const { register, handleSubmit, control: formControl } = useForm<Draft>({ defaultValues: { eventType:"FEEDING", occurredAt:localDateTime(), visibility:"PUBLIC", waterProvided:false } });
  const eventType=useWatch({control:formControl,name:"eventType"});

  async function submit(value: Draft) {
    setPending(true); setMessage(null);
    const details = value.eventType === "FEEDING" ? { foodType:value.foodType, waterProvided:value.waterProvided } : value.eventType === "HEALTH_OBSERVATION" ? { observedSigns:value.observedSigns.split(",").map(item=>item.trim()).filter(Boolean), professionalDiagnosis:false } : {};
    const result=await createPawEventAction({ dogId,eventType:value.eventType,title:value.title,description:value.description||undefined,occurredAt:new Date(value.occurredAt).toISOString(),locationLabel:value.locationLabel||undefined,visibility:value.visibility,details });
    setPending(false);
    if(!result.ok){setMessage(result.message);return;}
    setSaved(true);
  }

  if(saved)return <div className="card mx-auto max-w-2xl p-10 text-center"><CheckCircle2 className="mx-auto text-[var(--primary)]" size={45}/><h1 className="mt-5 text-3xl font-bold tracking-[-.04em]">Update added to {pawName}’s history</h1><p className="mt-3 text-[var(--muted)]">The care event keeps its contributor and submission timestamp without rewriting earlier history.</p><ButtonLink href={`/dogs/${pawCode}`} className="mt-7">View timeline</ButtonLink></div>;

  return <div className="mx-auto max-w-3xl"><p className="eyebrow">{pawName} · {pawCode}</p><h1 className="page-title mt-3">Add a care update</h1><p className="mt-3 text-[var(--muted)]">Record what happened without changing the existing history.</p><form onSubmit={handleSubmit(submit)} className="card mt-8 grid gap-6 p-5 sm:p-8"><label className="grid gap-2 text-sm font-bold">Type of update<select {...register("eventType")} className={controlClass}><option value="FEEDING">Feeding</option><option value="SIGHTING">Sighting</option><option value="HEALTH_OBSERVATION">Health observation</option><option value="VETERINARY_VISIT">Veterinary visit</option><option value="VACCINATION">Vaccination</option><option value="STERILISATION">Sterilisation</option><option value="RESCUE">Rescue</option><option value="GENERAL_UPDATE">General update</option></select></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Date and time<input type="datetime-local" {...register("occurredAt",{required:true})} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Visibility<select {...register("visibility")} className={controlClass}><option value="PUBLIC">Public after profile publication</option><option value="MEMBERS">Members only</option><option value="PRIVATE">Private</option></select></label></div><label className="grid gap-2 text-sm font-bold">Title<input {...register("title",{required:true,maxLength:160})} className={controlClass} placeholder="Evening meal and fresh water"/></label><label className="grid gap-2 text-sm font-bold">Description<textarea {...register("description")} className="min-h-32 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Describe what happened. Record observations rather than a diagnosis."/></label>
    {eventType==="FEEDING"&&<div className="grid gap-5 rounded-[12px] bg-[var(--primary-soft)] p-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Food provided<input {...register("foodType",{required:eventType==="FEEDING"})} className={controlClass} placeholder="Rice and chicken"/></label><label className="flex items-center gap-3 self-end rounded-[10px] bg-white p-3 text-sm font-bold"><input type="checkbox" {...register("waterProvided")} className="accent-[var(--primary)]"/><Droplets size={17} className="text-[var(--primary)]"/>Fresh water provided</label></div>}
    {eventType==="HEALTH_OBSERVATION"&&<label className="grid gap-2 text-sm font-bold">Observed signs <span className="text-xs font-normal text-[var(--muted)]">Separate multiple observations with commas.</span><input {...register("observedSigns",{required:eventType==="HEALTH_OBSERVATION"})} className={controlClass} placeholder="Limping, low appetite"/></label>}
    <label className="grid gap-2 text-sm font-bold">Approximate location <span className="text-xs font-normal text-[var(--muted)]">Optional; do not enter a private address.</span><span className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]" size={17}/><input {...register("locationLabel")} className={`${controlClass} w-full pl-10`} placeholder="Tholangamuwa area"/></span></label><div className="rounded-[10px] bg-[#f5ead5] p-4 text-sm leading-6 text-[#684b1a]"><strong>Append-only history:</strong> this creates a new event. Moderator corrections are captured separately in the event change log.</div>{message&&<p role="alert" className="rounded-[10px] bg-[#fff2e9] p-3 text-sm text-[var(--cocoa)]">{message}</p>}<div className="flex justify-end"><Button type="submit" disabled={pending}>{pending?"Saving update…":"Add to history"}</Button></div></form></div>;
}
