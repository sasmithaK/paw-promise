"use client";

import { useActionState } from "react";
import { Check, LoaderCircle, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderatePawAction, type ModerationResult } from "@/features/paws/actions";

const initialState: ModerationResult = { ok: false, message: "" };

export function ModerationControls({ dogId }: { dogId: string }) {
  const [state, formAction, pending] = useActionState(moderatePawAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="dogId" value={dogId} />
      <label className="grid gap-1.5 text-xs font-bold text-[var(--muted)]">
        Review note
        <textarea
          name="note"
          maxLength={1000}
          className="min-h-20 rounded-[10px] border border-[var(--line)] bg-white p-2.5 text-sm font-normal text-[var(--charcoal)]"
          placeholder="Required when rejecting or requesting changes."
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button name="decision" value="PUBLISH" size="sm" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
          Publish
        </Button>
        <Button name="decision" value="REJECT" variant="danger" size="sm" disabled={pending}>
          <X size={16} />
          Reject
        </Button>
      </div>
      <Button name="decision" value="REQUEST_CHANGES" variant="secondary" size="sm" disabled={pending}>
        <MessageSquareText size={16} />
        Request changes
      </Button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok
            ? "rounded-[8px] bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary-hover)]"
            : "rounded-[8px] bg-[#f3d8d0] px-3 py-2 text-sm font-semibold text-[#8c3f2e]"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
