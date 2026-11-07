"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, ArchiveRestore, LoaderCircle, RotateCcw, Trash2, X } from "lucide-react";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Button } from "@/components/ui/button";
import {
  archivePawAction,
  restoreArchivedPawAction,
  retryPawArchiveCleanupAction,
  type PawArchiveResult,
} from "@/features/paws/actions";

const initialState: PawArchiveResult = { ok: false, message: "" };

type Props = {
  dogId: string;
  pawCode: string;
  pawName: string;
  archived: boolean;
  cleanupPending: boolean;
  canArchive: boolean;
  canRestore: boolean;
};

function ResultMessage({ state }: { state: PawArchiveResult }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={state.ok
    ? "rounded-[9px] bg-[var(--primary-soft)] p-3 text-sm font-semibold text-[var(--primary-hover)]"
    : "rounded-[9px] bg-[#f3d8d0] p-3 text-sm font-semibold text-[#8c3f2e]"}>{state.message}</p>;
}

export function PawArchiveControls(props: Props) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [archiveState, archiveAction, archiving] = useActionState(archivePawAction, initialState);
  const [restoreState, restoreAction, restoring] = useActionState(restoreArchivedPawAction, initialState);

  if (props.archived) {
    return <section className="card mt-7 border-[#deb9a7] bg-[#fff8f4] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="eyebrow">Archived record</p><h2 className="mt-2 text-xl font-bold">This paw is removed from public view</h2><p className="mt-1 text-sm text-[var(--muted)]">Its permanent ID, care history, and audit trail remain preserved.</p></div>
        <div className="flex flex-wrap gap-2">
          {props.cleanupPending && <ActionFeedbackForm action={retryPawArchiveCleanupAction} submitLabel="Retry photo cleanup" pendingLabel="Cleaning…" variant="secondary" className="grid gap-2"><input type="hidden" name="dogId" value={props.dogId}/><input type="hidden" name="pawCode" value={props.pawCode}/></ActionFeedbackForm>}
          {props.canRestore && <Button type="button" variant="secondary" onClick={() => setRestoreOpen(true)}><ArchiveRestore size={17}/>Restore profile</Button>}
        </div>
      </div>
      {restoreState.message && <div className="mt-3"><ResultMessage state={restoreState}/></div>}
      {restoreOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={() => !restoring && setRestoreOpen(false)}>
        <div role="dialog" aria-modal="true" aria-labelledby="restore-paw-title" className="card w-full max-w-lg p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Super Admin action</p><h2 id="restore-paw-title" className="mt-2 text-2xl font-bold">Restore {props.pawCode}?</h2></div><button type="button" className="focus-ring rounded p-1" aria-label="Close restoration dialog" disabled={restoring} onClick={() => setRestoreOpen(false)}><X/></button></div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">The profile will return to pending review. A Moderator must review it again before it can become public.</p>
          <form action={restoreAction} className="mt-5 grid gap-4">
            <input type="hidden" name="dogId" value={props.dogId}/><input type="hidden" name="pawCode" value={props.pawCode}/>
            <label className="grid gap-1.5 text-sm font-bold">Restoration reason<textarea name="reason" required minLength={10} maxLength={1000} className="min-h-24 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Explain why this profile should return to review."/></label>
            <label className="grid gap-1.5 text-sm font-bold">Type {props.pawCode} to confirm<input name="confirmation" required autoComplete="off" className="h-11 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal uppercase"/></label>
            <ResultMessage state={restoreState}/>
            <div className="flex justify-end gap-2"><Button type="button" variant="quiet" disabled={restoring} onClick={() => setRestoreOpen(false)}>Cancel</Button><Button type="submit" disabled={restoring}>{restoring ? <><LoaderCircle className="animate-spin" size={17}/>Restoring…</> : <><RotateCcw size={17}/>Restore to review</>}</Button></div>
          </form>
        </div>
      </div>}
    </section>;
  }

  return <>
    <section className="mt-10 border-t border-[var(--line)] pt-6">
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#e4c1b3] bg-[#fff8f4] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 font-bold text-[#8c3f2e]"><AlertTriangle size={19}/>Record controls</h2><p className="mt-1 text-sm text-[var(--muted)]">Remove this profile from public and member workflows while preserving its permanent history.</p>{!props.canArchive && <p className="mt-2 text-xs font-semibold text-[#8c3f2e]">Moderators cannot remove their own submissions.</p>}</div>
        <Button type="button" variant="danger" disabled={!props.canArchive} onClick={() => setArchiveOpen(true)}><Trash2 size={17}/>Remove paw record</Button>
      </div>
      {archiveState.message && <div className="mt-3"><ResultMessage state={archiveState}/></div>}
    </section>
    {archiveOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="presentation" onMouseDown={() => !archiving && setArchiveOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="archive-paw-title" className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Governed removal</p><h2 id="archive-paw-title" className="mt-2 text-2xl font-bold">Remove {props.pawName}?</h2><p className="mt-1 text-sm font-semibold text-[var(--muted)]">{props.pawCode}</p></div><button type="button" className="focus-ring rounded p-1" aria-label="Close removal dialog" disabled={archiving} onClick={() => setArchiveOpen(false)}><X/></button></div>
        <div className="mt-4 rounded-[10px] bg-[#fff0e8] p-3 text-sm leading-6 text-[var(--cocoa)]">The profile will disappear publicly, open follow-ups will be cancelled, and approved public-photo copies will be removed. The Paw ID, private source, history, and audit trail remain preserved.</div>
        <form action={archiveAction} className="mt-5 grid gap-4">
          <input type="hidden" name="dogId" value={props.dogId}/><input type="hidden" name="pawCode" value={props.pawCode}/>
          <label className="grid gap-1.5 text-sm font-bold">Removal category<select name="category" required defaultValue="" className="h-11 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal"><option value="" disabled>Choose a reason</option><option value="DUPLICATE">Duplicate record</option><option value="INCORRECT">Incorrect or fraudulent submission</option><option value="PRIVACY_SAFETY">Privacy or safety concern</option><option value="TEST_RECORD">Test record</option><option value="OTHER">Other</option></select></label>
          <label className="grid gap-1.5 text-sm font-bold">Detailed reason<textarea name="reason" required minLength={10} maxLength={1000} className="min-h-28 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Explain what was checked and why this profile should be removed."/></label>
          <label className="grid gap-1.5 text-sm font-bold">Type {props.pawCode} to confirm<input name="confirmation" required autoComplete="off" className="h-11 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal uppercase"/></label>
          <ResultMessage state={archiveState}/>
          <div className="flex justify-end gap-2"><Button type="button" variant="quiet" disabled={archiving} onClick={() => setArchiveOpen(false)}>Cancel</Button><Button type="submit" variant="danger" disabled={archiving}>{archiving ? <><LoaderCircle className="animate-spin" size={17}/>Removing…</> : <><Trash2 size={17}/>Remove record</>}</Button></div>
        </form>
      </div>
    </div>}
  </>;
}
