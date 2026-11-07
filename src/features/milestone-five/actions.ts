"use server";

import { revalidatePath } from "next/cache";
import { requireActiveIdentity, requireModeratorIdentity, requireSuperAdminIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { accountStatusSchema, followUpCreateSchema, followUpStatusSchema, reportResolutionSchema, roleChangeSchema } from "@/lib/validation/milestone-five";

export type ActionResult = { ok: boolean; message: string };

function isoFromLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export async function createFollowUpAction(_previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const identity = await requireActiveIdentity();
  const parsed = followUpCreateSchema.safeParse({
    dogId: formData.get("dogId"),
    relatedEventId: formData.get("relatedEventId") || "",
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueAt: isoFromLocal(formData.get("dueAt")),
    assignedTo: formData.get("assignedTo") || identity.id,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the follow-up." };
  const value = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_follow_up" as never, {
    p_dog_id: value.dogId,
    p_related_event_id: value.relatedEventId || null,
    p_title: value.title,
    p_description: value.description || "",
    p_due_at: value.dueAt || null,
    p_assigned_to: value.assignedTo || identity.id,
  } as never);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/follow-ups");
  return { ok: true, message: "Follow-up created." };
}

export async function updateFollowUpStatusAction(formData: FormData): Promise<void> {
  await requireActiveIdentity();
  const parsed = followUpStatusSchema.safeParse({ followUpId: formData.get("followUpId"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid follow-up update.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_follow_up_status" as never, {
    p_follow_up_id: parsed.data.followUpId,
    p_status: parsed.data.status,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/follow-ups");
}

export async function resolveReportAction(formData: FormData): Promise<void> {
  await requireModeratorIdentity();
  const parsed = reportResolutionSchema.safeParse({
    reportId: formData.get("reportId"), status: formData.get("status"), resolutionNote: formData.get("resolutionNote"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid report decision.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_community_report" as never, {
    p_report_id: parsed.data.reportId, p_status: parsed.data.status, p_resolution_note: parsed.data.resolutionNote,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit");
}

export async function setAccountStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdminIdentity();
  const parsed = accountStatusSchema.safeParse({ userId: formData.get("userId"), status: formData.get("status"), reason: formData.get("reason") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid account update.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_account_status" as never, {
    p_user_id: parsed.data.userId, p_status: parsed.data.status, p_reason: parsed.data.reason,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}

export async function setMemberRoleAction(formData: FormData): Promise<void> {
  await requireSuperAdminIdentity();
  const parsed = roleChangeSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role"), enabled: formData.get("enabled"), reason: formData.get("reason") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid role update.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role" as never, {
    p_user_id: parsed.data.userId, p_role: parsed.data.role, p_enabled: parsed.data.enabled, p_reason: parsed.data.reason,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}
