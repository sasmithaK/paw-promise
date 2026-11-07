"use client";

import { useActionState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/features/milestone-five/actions";

const initialState: ActionResult = { ok: false, message: "" };

type Props = {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
};

export function ActionFeedbackForm({
  action,
  children,
  className,
  submitLabel,
  pendingLabel = "Saving…",
  variant = "primary",
  disabled = false,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={className}>
      {children}
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
      <Button type="submit" size="sm" variant={variant} disabled={disabled || pending}>
        {pending && <LoaderCircle className="animate-spin" size={16} />}
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
