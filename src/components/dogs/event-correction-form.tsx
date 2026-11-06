"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { correctPawEventAction } from "@/features/paws/actions";

type EventValue = {
  id: string; title: string; description: string | null; occurredAt: string;
  locationLabel: string | null; visibility: "PUBLIC" | "MEMBERS" | "PRIVATE";
  verificationStatus: "UNVERIFIED" | "EVIDENCE_ATTACHED" | "VERIFIED" | "DISPUTED";
};
const controlClass = "h-11 rounded-[10px] border border-[var(--line)] bg-white px-3";
function localValue(value: string) { const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); }

export function EventCorrectionForm({ event }: { event: EventValue }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) {
    formData.set("eventId", event.id);
    startTransition(async () => {
      const result = await correctPawEventAction(formData);
      setMessage(result.message);
      if (result.ok) { router.push("/activities"); router.refresh(); }
    });
  }
  return <form action={submit} className="card mt-7 grid gap-5 p-5 sm:p-8"><div className="flex gap-3 rounded-[10px] bg-[#fff2e9] p-4 text-sm leading-6 text-[var(--cocoa)]"><AlertTriangle className="mt-0.5 shrink-0" size={19}/><p>This does not overwrite history silently. The old and new values, your authenticated identity, timestamp, and required reason are stored in the append-only change log.</p></div><label className="grid gap-2 text-sm font-bold">Correction reason<textarea name="reason" required maxLength={500} className="min-h-24 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Explain why this record needs correction."/></label><label className="grid gap-2 text-sm font-bold">Title<input name="title" required maxLength={160} defaultValue={event.title} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Description<textarea name="description" maxLength={4000} defaultValue={event.description || ""} className="min-h-32 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal"/></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Occurred at<input name="occurredAt" type="datetime-local" required defaultValue={localValue(event.occurredAt)} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Approximate location<input name="locationLabel" maxLength={200} defaultValue={event.locationLabel || ""} className={controlClass}/></label><label className="grid gap-2 text-sm font-bold">Visibility<select name="visibility" defaultValue={event.visibility} className={controlClass}><option value="PUBLIC">Public</option><option value="MEMBERS">Restricted</option><option value="PRIVATE">Private</option></select></label><label className="grid gap-2 text-sm font-bold">Verification<select name="verificationStatus" defaultValue={event.verificationStatus} className={controlClass}><option value="UNVERIFIED">Unverified</option><option value="EVIDENCE_ATTACHED">Evidence attached</option><option value="VERIFIED">Verified</option><option value="DISPUTED">Disputed</option></select></label></div>{message && <p role="alert" className="rounded-[10px] bg-[var(--primary-soft)] p-3 text-sm">{message}</p>}<div className="flex flex-wrap justify-end gap-3"><ButtonLink href="/activities" variant="secondary">Cancel</ButtonLink><Button type="submit" disabled={pending}>{pending ? "Recording correction…" : "Record correction"}</Button></div></form>;
}
