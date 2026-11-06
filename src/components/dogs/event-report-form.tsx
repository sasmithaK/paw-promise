"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportPawEventAction } from "@/features/paws/actions";

export function EventReportForm({ dogId, eventId }: { dogId: string; eventId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    formData.set("dogId", dogId);
    formData.set("eventId", eventId);
    startTransition(async () => {
      const result = await reportPawEventAction(formData);
      setMessage(result.message);
      if (result.ok) setOpen(false);
    });
  }

  if (!open) return <div className="mt-4 flex items-center justify-end gap-3"><button type="button" onClick={() => { setMessage(null); setOpen(true); }} className="focus-ring flex items-center gap-1.5 rounded px-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary-hover)]"><Flag size={14}/>Report this update</button>{message && <span role="status" className="text-xs text-[var(--primary-hover)]">{message}</span>}</div>;

  return <form action={submit} className="mt-4 grid gap-3 rounded-[10px] border border-[var(--line)] bg-[#fffaf5] p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold">Report a concern</p><button type="button" onClick={() => setOpen(false)} aria-label="Close report form" className="focus-ring rounded p-1"><X size={16}/></button></div><p className="text-xs leading-5 text-[var(--muted)]">You must sign in to submit. Your identity is visible only to authorised moderators.</p><label className="grid gap-1.5 text-xs font-bold">Reason<input name="reason" required minLength={3} maxLength={160} className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3" placeholder="Incorrect information or safety concern"/></label><label className="grid gap-1.5 text-xs font-bold">Details<textarea name="description" maxLength={2000} className="min-h-20 rounded-[9px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Explain what the moderation team should review."/></label>{message && <p role="alert" className="text-xs text-[var(--cocoa)]">{message}</p>}<Button type="submit" size="sm" disabled={pending} className="w-fit">{pending ? "Sending…" : "Send privately"}</Button></form>;
}
