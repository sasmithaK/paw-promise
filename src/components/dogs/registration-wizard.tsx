"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, LocateFixed, MapPin, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { registerPawAction } from "@/features/paws/actions";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = ["Identification", "Discovery", "People present", "Initial condition", "Review"];
const inputClass = "h-11 w-full rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal text-[var(--charcoal)] placeholder:text-[#a0a39e]";

type Draft = {
  name: string;
  sex: "MALE" | "FEMALE" | "UNKNOWN";
  estimatedAge: string;
  breed: string;
  colour: string;
  size: "UNKNOWN" | "SMALL" | "MEDIUM" | "LARGE";
  distinguishingFeatures: string;
  foundAt: string;
  foundLocationLabel: string;
  discoveryDescription: string;
  participantName: string;
  participantContext: string;
  initialObservation: string;
  vaccinationStatus: "UNKNOWN" | "REPORTED" | "EVIDENCE_ATTACHED";
  sterilisationStatus: "UNKNOWN" | "REPORTED" | "EVIDENCE_ATTACHED";
  confirmation: boolean;
};

type Coordinates = { latitude: number; longitude: number; accuracyMeters?: number };

function defaultLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold">{label}{children}{error ? <span className="text-xs font-semibold text-[var(--terracotta)]">{error}</span> : hint ? <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span> : null}</label>;
}

export function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [submission, setSubmission] = useState<{ pawCode: string } | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<"idle" | "uploading" | "saving">("idle");
  const { register, handleSubmit, trigger, control, formState: { errors } } = useForm<Draft>({
    defaultValues: { sex: "UNKNOWN", size: "UNKNOWN", foundAt: defaultLocalDateTime(), vaccinationStatus: "UNKNOWN", sterilisationStatus: "UNKNOWN", confirmation: false },
  });
  const values = useWatch({ control });

  function selectPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function continueStep() {
    if (step === 0 && !photo) { setSubmitMessage("Choose a clear primary photograph before continuing."); return; }
    if (step === 1 && !(await trigger(["foundAt", "foundLocationLabel"]))) return;
    setSubmitMessage(null);
    setStep(current => Math.min(4, current + 1));
  }

  function useCurrentLocation() {
    setLocationMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      position => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: Math.round(position.coords.accuracy) });
        setLocationMessage(`Location captured to approximately ${Math.round(position.coords.accuracy)} metres. Only a rounded point will be public.`);
      },
      () => setLocationMessage("Location was unavailable. You can continue using the locality description only."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function submit(valuesToSave: Draft) {
    if (!photo) { setStep(0); setSubmitMessage("Choose a primary photograph."); return; }
    if (!valuesToSave.confirmation) { setSubmitMessage("Confirm the accuracy statement before submitting."); return; }
    if (!photo.type.match(/^image\/(jpeg|png|webp)$/) || photo.size > 10 * 1024 * 1024) { setStep(0); setSubmitMessage("Use a JPG, PNG, or WebP photograph no larger than 10 MB."); return; }

    setSubmitMessage(null);
    setSubmitStage("uploading");
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setSubmitStage("idle"); setSubmitMessage("Your session could not be verified. Sign in again and retry."); return; }
    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("dog-private-photos").upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) { setSubmitStage("idle"); setSubmitMessage(`Photo upload failed: ${uploadError.message}. Your form is still here—retry when ready.`); return; }

    setSubmitStage("saving");
    const result = await registerPawAction({
      primaryPhotoPath: path,
      name: valuesToSave.name,
      sex: valuesToSave.sex,
      estimatedAge: valuesToSave.estimatedAge,
      breed: valuesToSave.breed,
      colour: valuesToSave.colour,
      size: valuesToSave.size,
      distinguishingFeatures: valuesToSave.distinguishingFeatures,
      foundAt: new Date(valuesToSave.foundAt).toISOString(),
      foundLocationLabel: valuesToSave.foundLocationLabel,
      coordinates,
      discoveryDescription: valuesToSave.discoveryDescription,
      initialObservation: valuesToSave.initialObservation,
      vaccinationStatus: valuesToSave.vaccinationStatus,
      sterilisationStatus: valuesToSave.sterilisationStatus,
      participants: valuesToSave.participantName.trim() ? [{ kind: "NON_MEMBER", name: valuesToSave.participantName, context: valuesToSave.participantContext || undefined }] : [],
    });
    if (!result.ok) {
      await supabase.storage.from("dog-private-photos").remove([path]);
      setSubmitStage("idle");
      setSubmitMessage(`${result.message} The private upload was cleaned up; your form values are preserved.`);
      return;
    }
    setSubmitStage("idle");
    setSubmission({ pawCode: result.pawCode });
  }

  if (submission) return <div className="mx-auto max-w-2xl py-10 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"><CheckCircle2 size={32}/></span><p className="eyebrow mt-6">Submitted for moderation</p><h1 className="page-title mt-3">Thank you for making this pup visible.</h1><p className="body-lg mx-auto mt-4 max-w-xl">The new paw profile, discovery event, participant details, and private photograph were saved together. A moderator must review it before publication.</p><div className="card mx-auto mt-7 max-w-sm p-5 text-left"><p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Permanent Paw ID</p><p className="mt-2 text-2xl font-bold">{submission.pawCode}</p></div><ButtonLink href="/dashboard/dogs" className="mt-7">View your paw profiles</ButtonLink></div>;

  return <form onSubmit={handleSubmit(submit)} className="mx-auto max-w-5xl"><div className="mb-6"><p className="eyebrow">New paw profile</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] sm:text-4xl">Introduce a pup</h1><p className="mt-2 text-sm text-[var(--muted)]">Unknown is a valid answer. Record only what you observed.</p></div>
    <ol className="mb-6 flex gap-1 overflow-x-auto pb-2 sm:grid sm:grid-cols-5">{steps.map((name,index)=><li key={name} className="min-w-[130px] sm:min-w-0"><button type="button" onClick={()=>index<step&&setStep(index)} disabled={index>step} className="w-full text-left"><div className={cn("h-1.5 rounded-full",index<=step?"bg-[var(--primary)]":"bg-[#e4d5ca]")}/><span className={cn("mt-2 block text-xs font-semibold",index===step?"text-[var(--primary-hover)]":"text-[var(--muted)]")}>{index+1}. {name}</span></button></li>)}</ol>
    <div className="grid gap-7 lg:grid-cols-[1fr_270px]"><section className="card p-5 sm:p-8">
      {step===0&&<div><h2 className="text-2xl font-bold tracking-[-.035em]">Help us recognise this pup</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Start with a clear photograph. A name is helpful but not required.</p><div className="mt-7"><p className="text-sm font-bold">Primary photograph <span className="text-[var(--terracotta)]">*</span></p><label className="focus-ring relative mt-2 grid min-h-52 cursor-pointer place-items-center overflow-hidden rounded-[12px] border border-dashed border-[var(--primary-soft-strong)] bg-[#fff6ef] p-6 text-center hover:bg-[var(--primary-soft)]">{preview ? <><Image src={preview} alt="Selected primary photograph preview" fill unoptimized className="object-cover"/><span className="absolute bottom-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow">Choose a different photo</span></> : <span><UploadCloud className="mx-auto text-[var(--primary)]"/><span className="mt-3 block font-bold">Choose a photo</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">JPG, PNG, or WebP · up to 10 MB</span></span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event=>selectPhoto(event.target.files?.[0] ?? null)}/></label>{photo&&<div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--muted)]"><span className="truncate">{photo.name} · {(photo.size/1024/1024).toFixed(1)} MB</span><button type="button" onClick={()=>selectPhoto(null)} className="inline-flex items-center gap-1 font-bold text-[var(--terracotta)]"><Trash2 size={14}/>Remove</button></div>}</div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Name" hint="Leave blank if unknown."><input {...register("name")} className={inputClass} placeholder="Known name, if any"/></Field><Field label="Sex"><select {...register("sex")} className={inputClass}><option value="UNKNOWN">Unknown</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></Field><Field label="Estimated age"><select {...register("estimatedAge")} className={inputClass}><option value="">Unknown</option><option>Under 1 year</option><option>1–3 years</option><option>4–7 years</option><option>Over 7 years</option></select></Field><Field label="Size"><select {...register("size")} className={inputClass}><option value="UNKNOWN">Unknown</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option></select></Field><Field label="Breed or type"><input {...register("breed")} className={inputClass} placeholder="Mixed breed or unknown"/></Field><Field label="Colour"><input {...register("colour")} className={inputClass} placeholder="Brown and white"/></Field></div><div className="mt-5"><Field label="Distinguishing features"><textarea {...register("distinguishingFeatures")} className="min-h-24 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal"/></Field></div></div>}
      {step===1&&<div><h2 className="text-2xl font-bold tracking-[-.035em]">Where and when was this pup found?</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The public profile receives only a rounded map point. Exact coordinates remain restricted.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Date and approximate time" error={errors.foundAt?.message}><input type="datetime-local" {...register("foundAt", { required: "Enter when the pup was found." })} className={inputClass}/></Field><Field label="Approximate locality" error={errors.foundLocationLabel?.message}><input {...register("foundLocationLabel", { required: "Describe the approximate locality.", maxLength: 200 })} className={inputClass} placeholder="Near Tholangamuwa town"/></Field></div><div className="mt-6 overflow-hidden rounded-[12px] border border-[var(--line)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white p-4"><div><p className="text-sm font-bold">Location pin <span className="font-normal text-[var(--muted)]">(optional)</span></p><p className="mt-1 text-xs text-[var(--muted)]">Use your device location, then review the captured accuracy.</p></div><Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation}><LocateFixed size={16}/>Use my location</Button></div><div className="relative grid h-52 place-items-center bg-[#e7e5dc] text-center"><div className="absolute inset-0 opacity-45" style={{backgroundImage:"linear-gradient(28deg, transparent 48%, #c4c3b9 49%, #c4c3b9 51%, transparent 52%), linear-gradient(118deg, transparent 48%, #c4c3b9 49%, #c4c3b9 51%, transparent 52%)",backgroundSize:"74px 74px"}}/>{coordinates?<span className="z-10"><MapPin size={38} fill="#d66f45" className="mx-auto text-[var(--primary)]"/><span className="mt-2 block rounded bg-white px-3 py-1.5 text-xs font-bold shadow">{coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}</span></span>:<span className="z-10 rounded-[10px] bg-white px-4 py-2 text-sm font-bold shadow-sm">No precise point recorded</span>}</div></div>{locationMessage&&<p className="mt-3 text-xs leading-5 text-[var(--muted)]">{locationMessage}</p>}<div className="mt-5"><Field label="Discovery description"><textarea {...register("discoveryDescription")} className="min-h-28 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Describe where the pup was and what was happening."/></Field></div></div>}
      {step===2&&<div><h2 className="text-2xl font-bold tracking-[-.035em]">Who else was present?</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Optional. Do not add contact details.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Person’s name"><input {...register("participantName")} className={inputClass} placeholder="Leave blank if nobody else is recorded"/></Field><Field label="Context"><select {...register("participantContext")} className={inputClass}><option value="">Select context</option><option>Volunteer</option><option>Local resident</option><option>Friend</option><option>Other</option></select></Field></div><div className="mt-6 rounded-[12px] bg-[var(--sage)] p-4 text-sm leading-6 text-[var(--forest-deep)]">Only include someone’s name when there is a legitimate reason and appropriate permission.</div></div>}
      {step===3&&<div><h2 className="text-2xl font-bold tracking-[-.035em]">What did you observe?</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Describe visible condition only. Do not guess a diagnosis.</p><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Vaccination status"><select {...register("vaccinationStatus")} className={inputClass}><option value="UNKNOWN">Unknown</option><option value="REPORTED">Reported vaccinated</option><option value="EVIDENCE_ATTACHED">Evidence available</option></select></Field><Field label="Sterilisation status"><select {...register("sterilisationStatus")} className={inputClass}><option value="UNKNOWN">Unknown</option><option value="REPORTED">Reported sterilised</option><option value="EVIDENCE_ATTACHED">Evidence available</option></select></Field></div><div className="mt-5"><Field label="Initial observation"><textarea {...register("initialObservation")} className="min-h-32 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Visible condition, mobility, injuries, coat, or behaviour."/></Field></div></div>}
      {step===4&&<div><h2 className="text-2xl font-bold tracking-[-.035em]">Review before submitting</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">The profile will be Pending and cannot be published by its contributor.</p><div className="mt-7 divide-y divide-[var(--line)] rounded-[12px] border border-[var(--line)]"><ReviewRow title="Identification" value={`${photo?.name || "Photo required"} · ${values.name || "Unnamed pup"}`} onEdit={()=>setStep(0)}/><ReviewRow title="Discovery" value={`${values.foundLocationLabel || "Locality required"}${coordinates ? " · restricted pin captured" : " · no map pin"}`} onEdit={()=>setStep(1)}/><ReviewRow title="Person present" value={values.participantName || "No additional person recorded"} onEdit={()=>setStep(2)}/><ReviewRow title="Initial condition" value={values.initialObservation || "No additional observation"} onEdit={()=>setStep(3)}/></div><label className="mt-6 flex items-start gap-3 rounded-[12px] bg-[var(--sage)] p-4 text-sm leading-6 text-[var(--forest-deep)]"><input type="checkbox" {...register("confirmation")} className="mt-1 accent-[var(--primary)]"/>I confirm this information is accurate to the best of my knowledge and describes observations rather than an unverified veterinary diagnosis.</label></div>}
      {submitMessage&&<div role="alert" className="mt-6 rounded-[10px] border border-[#e4b79f] bg-[#fff2e9] p-4 text-sm text-[var(--cocoa)]">{submitMessage}</div>}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-[var(--line)] pt-6 sm:flex-row"><Button type="button" variant="secondary" disabled={step===0 || submitStage!=="idle"} onClick={()=>setStep(Math.max(0,step-1))}><ArrowLeft size={17}/>Back</Button>{step<4?<Button type="button" onClick={continueStep}>Continue <ArrowRight size={17}/></Button>:<Button type="submit" disabled={submitStage!=="idle"}>{submitStage==="uploading"?"Uploading photograph…":submitStage==="saving"?"Creating paw profile…":"Submit for review"} <Check size={17}/></Button>}</div>
    </section><aside className="space-y-4"><div className="card p-5"><ShieldCheck className="text-[var(--primary)]"/><h2 className="mt-3 font-bold">Privacy built in</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Exact locations, pending photographs, and personal details never appear on the public profile.</p></div><div className="card p-5"><Camera className="text-[var(--primary)]"/><h2 className="mt-3 font-bold">Photo tips</h2><ul className="mt-2 grid gap-2 text-sm leading-6 text-[var(--muted)]"><li>• Show the pup’s full face and body</li><li>• Avoid including people</li><li>• Use a recent, well-lit photograph</li></ul></div></aside></div>
  </form>;
}

function ReviewRow({title,value,onEdit}:{title:string;value:string;onEdit:()=>void}) { return <div className="flex items-start justify-between gap-4 p-4"><div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{value}</p></div><button type="button" onClick={onEdit} className="text-sm font-bold text-[var(--primary-hover)]">Edit</button></div>; }
