"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveIdentity, requireModeratorIdentity, requireSuperAdminIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { dogRegistrationSchema } from "@/lib/validation/dog-registration";
import { eventCorrectionSchema, eventCreationSchema, eventReportSchema } from "@/lib/validation/event";
import { pendingPawUpdateSchema } from "@/lib/validation/milestone-five";
import type { Json } from "@/types/database";

export type PawRegistrationResult =
  | { ok: true; dogId: string; pawCode: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function registerPawAction(input: unknown): Promise<PawRegistrationResult> {
  await requireActiveIdentity();
  const parsed = dogRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please review the highlighted information.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const value = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_paw", {
    p_primary_photo_path: value.primaryPhotoPath,
    p_name: value.name ?? "",
    p_sex: value.sex,
    p_estimated_age: value.estimatedAge ?? "",
    p_breed: value.breed ?? "",
    p_colour: value.colour ?? "",
    p_size: value.size,
    p_distinguishing_features: value.distinguishingFeatures ?? "",
    p_found_at: value.foundAt,
    p_found_location_label: value.foundLocationLabel,
    p_latitude: value.coordinates?.latitude ?? null,
    p_longitude: value.coordinates?.longitude ?? null,
    p_location_accuracy_m: value.coordinates?.accuracyMeters ?? null,
    p_discovery_description: value.discoveryDescription ?? "",
    p_initial_observation: value.initialObservation ?? "",
    p_vaccination_status: value.vaccinationStatus,
    p_sterilisation_status: value.sterilisationStatus,
    p_participants: value.participants,
  } as never);

  if (error || !data?.[0]) {
    return { ok: false, message: error?.message || "The paw profile could not be created." };
  }

  revalidatePath("/");
  revalidatePath("/paws");
  revalidatePath("/dashboard/paws");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  return { ok: true, dogId: data[0].dog_id, pawCode: data[0].paw_code };
}

const moderationInputSchema = z.object({
  dogId: z.uuid(),
  decision: z.enum(["PUBLISH", "REJECT", "REQUEST_CHANGES"]),
  note: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if ((value.decision === "REQUEST_CHANGES" || value.decision === "REJECT") && !value.note) {
    context.addIssue({ code: "custom", path: ["note"], message: "Explain what needs to change." });
  }
});

export type ModerationResult = { ok: boolean; message: string };

const approvedPhotoMimeTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function approvedPhotoMimeType(path: string, reportedType: string) {
  if (Object.values(approvedPhotoMimeTypes).includes(reportedType)) return reportedType;
  const extension = path.split(".").pop()?.toLowerCase() || "";
  return approvedPhotoMimeTypes[extension] || null;
}

function revalidateModerationViews() {
  revalidatePath("/");
  revalidatePath("/paws");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/dashboard/paws");
  revalidatePath("/admin/archived");
}

export async function moderatePawAction(
  _previous: ModerationResult,
  formData: FormData,
): Promise<ModerationResult> {
  const identity = await requireModeratorIdentity();
  const parsed = moderationInputSchema.safeParse({
    dogId: formData.get("dogId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Review the moderation decision." };
  }

  const { dogId, decision, note } = parsed.data;
  const supabase = await createClient();
  const { data: paw, error: pawError } = await supabase.from("dogs").select("id,created_by,record_status").eq("id", dogId).single();
  if (pawError || !paw) return { ok: false, message: "The paw profile could not be loaded. Refresh and try again." };
  if (paw.created_by === identity.id) return { ok: false, message: "You cannot review your own submission." };
  if (paw.record_status !== "PENDING") return { ok: false, message: "This profile has already been reviewed." };

  let publishedPhotoPath: string | null = null;
  if (decision === "PUBLISH") {
    const { data: photo, error: photoError } = await supabase.from("dog_photos").select("storage_path").eq("dog_id", dogId).eq("is_primary", true).single();
    if (photoError || !photo) return { ok: false, message: "A primary photograph is required before publication." };
    const { data: privatePhoto, error: downloadError } = await supabase.storage.from("dog-private-photos").download(photo.storage_path);
    if (downloadError || !privatePhoto) {
      return { ok: false, message: "The private photograph could not be prepared for publication." };
    }
    const contentType = approvedPhotoMimeType(photo.storage_path, privatePhoto.type);
    if (!contentType) return { ok: false, message: "The primary photograph has an unsupported file type." };
    const { error: uploadError } = await supabase.storage.from("dog-public-photos").upload(photo.storage_path, privatePhoto, {
      contentType,
      upsert: true,
    });
    if (uploadError) return { ok: false, message: "The approved photograph could not be published. Please try again." };
    publishedPhotoPath = photo.storage_path;
  }

  const { error } = await supabase.rpc("moderate_paw", {
    p_dog_id: dogId,
    p_decision: decision,
    p_note: note || undefined,
  });
  if (error) {
    // A concurrent moderator may have published while this request was
    // copying the same source image. Never remove their successful public
    // object; treat that race as an already-completed success.
    const { data: currentPaw } = await supabase.from("dogs").select("record_status").eq("id", dogId).maybeSingle();
    if (currentPaw?.record_status === "PUBLISHED") {
      revalidateModerationViews();
      return { ok: true, message: "This paw profile was already published by another reviewer." };
    }
    if (publishedPhotoPath) await supabase.storage.from("dog-public-photos").remove([publishedPhotoPath]);
    return { ok: false, message: error.message || "The moderation decision could not be saved." };
  }

  revalidateModerationViews();
  return {
    ok: true,
    message: decision === "PUBLISH"
      ? "Paw profile published."
      : decision === "REJECT"
        ? "Paw profile rejected."
        : "Changes requested from the submitting member.",
  };
}

const pawArchiveSchema = z.object({
  dogId: z.uuid(),
  pawCode: z.string().regex(/^PP-\d{6}$/),
  confirmation: z.string().trim(),
  category: z.enum(["DUPLICATE", "INCORRECT", "PRIVACY_SAFETY", "TEST_RECORD", "OTHER"]),
  reason: z.string().trim().min(10, "Explain the removal in at least 10 characters.").max(1000),
}).refine((value) => value.confirmation.toUpperCase() === value.pawCode, {
  path: ["confirmation"],
  message: "Type the complete Paw ID to confirm removal.",
});

const pawRestoreSchema = z.object({
  dogId: z.uuid(),
  pawCode: z.string().regex(/^PP-\d{6}$/),
  confirmation: z.string().trim(),
  reason: z.string().trim().min(10, "Explain the restoration in at least 10 characters.").max(1000),
}).refine((value) => value.confirmation.toUpperCase() === value.pawCode, {
  path: ["confirmation"],
  message: "Type the complete Paw ID to confirm restoration.",
});

export type PawArchiveResult = { ok: boolean; message: string };

function archiveCleanupPaths(value: Json): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const paths = value.cleanup_paths;
  return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === "string") : [];
}

export async function archivePawAction(
  _previous: PawArchiveResult,
  formData: FormData,
): Promise<PawArchiveResult> {
  await requireModeratorIdentity();
  const parsed = pawArchiveSchema.safeParse({
    dogId: formData.get("dogId"),
    pawCode: formData.get("pawCode"),
    confirmation: formData.get("confirmation"),
    category: formData.get("category"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the removal details." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("archive_paw", {
    p_dog_id: parsed.data.dogId,
    p_category: parsed.data.category,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: error.message || "The paw profile could not be removed." };

  const cleanupPaths = archiveCleanupPaths(data);
  if (cleanupPaths.length) {
    const { error: cleanupError } = await supabase.storage.from("dog-public-photos").remove(cleanupPaths);
    if (cleanupError) {
      revalidateModerationViews();
      return {
        ok: true,
        message: "Paw profile removed from the directory. Public photo cleanup is queued for retry.",
      };
    }
    await supabase.rpc("confirm_paw_archive_cleanup", { p_dog_id: parsed.data.dogId });
  }

  revalidateModerationViews();
  revalidatePath(`/dashboard/paws/${parsed.data.pawCode}`);
  return { ok: true, message: "Paw profile archived. Its permanent ID and history were preserved." };
}

export async function retryPawArchiveCleanupAction(
  _previous: PawArchiveResult,
  formData: FormData,
): Promise<PawArchiveResult> {
  await requireModeratorIdentity();
  const dogId = z.uuid().safeParse(formData.get("dogId"));
  const pawCode = z.string().regex(/^PP-\d{6}$/).safeParse(formData.get("pawCode"));
  if (!dogId.success) return { ok: false, message: "The archived profile could not be identified." };

  const supabase = await createClient();
  const { data: paw } = await supabase.from("dogs").select("record_status").eq("id", dogId.data).maybeSingle();
  if (paw?.record_status !== "ARCHIVED") return { ok: false, message: "Only archived profiles can retry cleanup." };
  const { data: photos, error: photoError } = await supabase.from("dog_photos").select("storage_path").eq("dog_id", dogId.data).eq("is_primary", true);
  if (photoError) return { ok: false, message: "The archived photo records could not be loaded." };
  const paths = photos.map((photo) => photo.storage_path);
  if (paths.length) {
    const { error } = await supabase.storage.from("dog-public-photos").remove(paths);
    if (error) return { ok: false, message: "Public photo cleanup is still unavailable. Try again later." };
  }
  const { error } = await supabase.rpc("confirm_paw_archive_cleanup", { p_dog_id: dogId.data });
  if (error) return { ok: false, message: "Cleanup finished, but its status could not be confirmed." };
  revalidateModerationViews();
  if (pawCode.success) revalidatePath(`/dashboard/paws/${pawCode.data}`);
  return { ok: true, message: "Public photo cleanup completed." };
}

export async function restoreArchivedPawAction(
  _previous: PawArchiveResult,
  formData: FormData,
): Promise<PawArchiveResult> {
  await requireSuperAdminIdentity();
  const parsed = pawRestoreSchema.safeParse({
    dogId: formData.get("dogId"),
    pawCode: formData.get("pawCode"),
    confirmation: formData.get("confirmation"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the restoration details." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_archived_paw", {
    p_dog_id: parsed.data.dogId,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: error.message || "The paw profile could not be restored." };
  revalidateModerationViews();
  revalidatePath(`/dashboard/paws/${parsed.data.pawCode}`);
  return { ok: true, message: "Paw profile restored to pending review." };
}

export type PawEventResult = { ok: true; eventId: string } | { ok: false; message: string };

const evidenceTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

function parseJsonField(formData: FormData, key: string, fallback: unknown) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) return fallback;
  try { return JSON.parse(value) as unknown; } catch { return fallback; }
}

export async function createPawEventAction(formData: FormData): Promise<PawEventResult> {
  const identity = await requireActiveIdentity();
  const parsed = eventCreationSchema.safeParse({
    dogId: formData.get("dogId"),
    eventType: formData.get("eventType"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    occurredAt: formData.get("occurredAt"),
    locationLabel: formData.get("locationLabel") || undefined,
    coordinates: parseJsonField(formData, "coordinates", null),
    visibility: formData.get("visibility"),
    participants: parseJsonField(formData, "participants", []),
    details: parseJsonField(formData, "details", {}),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the care update." };

  const files = formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 5) return { ok: false, message: "Attach no more than five evidence files." };
  for (const file of files) {
    if (!evidenceTypes.has(file.type)) return { ok: false, message: "Evidence must be a JPEG, PNG, WebP, or PDF file." };
    if (file.size > 15 * 1024 * 1024) return { ok: false, message: "Each evidence file must be 15 MB or smaller." };
  }

  const value = parsed.data;
  const supabase = await createClient();
  const uploaded: Array<{ storagePath: string; attachmentType: string }> = [];
  for (const file of files) {
    const extension = evidenceTypes.get(file.type)!;
    const storagePath = `${identity.id}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("event-evidence").upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      if (uploaded.length) await supabase.storage.from("event-evidence").remove(uploaded.map(item => item.storagePath));
      return { ok: false, message: `Evidence upload failed: ${error.message}` };
    }
    uploaded.push({ storagePath, attachmentType: file.type });
  }

  const { data, error } = await supabase.rpc("create_paw_event", {
    p_dog_id: value.dogId,
    p_event_type: value.eventType,
    p_title: value.title,
    p_description: value.description || "",
    p_occurred_at: value.occurredAt,
    p_location_label: value.locationLabel || "",
    p_visibility: value.visibility,
    p_latitude: value.coordinates?.latitude ?? null,
    p_longitude: value.coordinates?.longitude ?? null,
    p_location_accuracy_m: value.coordinates?.accuracyMeters ?? null,
    p_details: value.details as Json,
    p_participants: value.participants as Json,
    p_attachments: uploaded as Json,
  });
  if (error || !data) {
    if (uploaded.length) await supabase.storage.from("event-evidence").remove(uploaded.map(item => item.storagePath));
    return { ok: false, message: error?.message || "The care update could not be created." };
  }
  revalidatePath("/activities");
  revalidatePath("/paws");
  revalidatePath("/dashboard/paws");
  return { ok: true, eventId: data };
}

export async function reportPawEventAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const identity = await requireActiveIdentity();
  const parsed = eventReportSchema.safeParse({
    dogId: formData.get("dogId"),
    eventId: formData.get("eventId"),
    reason: formData.get("reason"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the report." };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    dog_id: parsed.data.dogId,
    event_id: parsed.data.eventId,
    reporter_id: identity.id,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  return { ok: true, message: "Your concern was sent to the moderation team." };
}

export async function correctPawEventAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireModeratorIdentity();
  const occurredAt = formData.get("occurredAt");
  const occurredDate = typeof occurredAt === "string" ? new Date(occurredAt) : null;
  const parsed = eventCorrectionSchema.safeParse({
    eventId: formData.get("eventId"),
    reason: formData.get("reason"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    occurredAt: occurredDate && !Number.isNaN(occurredDate.getTime()) ? occurredDate.toISOString() : occurredAt,
    locationLabel: formData.get("locationLabel") || undefined,
    visibility: formData.get("visibility"),
    verificationStatus: formData.get("verificationStatus"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the correction." };
  const value = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_paw_event", {
    p_event_id: value.eventId,
    p_reason: value.reason,
    p_title: value.title,
    p_description: value.description || "",
    p_occurred_at: value.occurredAt,
    p_location_label: value.locationLabel || "",
    p_visibility: value.visibility,
    p_verification_status: value.verificationStatus,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/activities");
  revalidatePath("/paws");
  revalidatePath("/admin/audit");
  return { ok: true, message: "Correction saved in the permanent change history." };
}

export async function updatePendingPawAction(formData: FormData): Promise<void> {
  const identity = await requireActiveIdentity();
  const foundAtValue = formData.get("foundAt");
  const foundAt = typeof foundAtValue === "string" ? new Date(foundAtValue) : null;
  const parsed = pendingPawUpdateSchema.safeParse({
    dogId: formData.get("dogId"),
    name: formData.get("name") || undefined,
    sex: formData.get("sex"),
    estimatedAge: formData.get("estimatedAge") || undefined,
    breed: formData.get("breed") || undefined,
    colour: formData.get("colour") || undefined,
    size: formData.get("size"),
    distinguishingFeatures: formData.get("distinguishingFeatures") || undefined,
    foundAt: foundAt && !Number.isNaN(foundAt.getTime()) ? foundAt.toISOString() : foundAtValue,
    foundLocationLabel: formData.get("foundLocationLabel"),
    vaccinationStatus: formData.get("vaccinationStatus"),
    sterilisationStatus: formData.get("sterilisationStatus"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Review the paw profile.");
  const value = parsed.data;
  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase.from("dogs").select("created_by,record_status").eq("id", value.dogId).single();
  if (loadError || !existing) throw new Error("The pending paw profile could not be loaded.");
  if (existing.created_by !== identity.id || existing.record_status !== "PENDING") throw new Error("Only your own pending profile can be edited.");
  const { error } = await supabase.rpc("update_pending_paw" as never, {
    p_dog_id: value.dogId,
    p_name: value.name || "",
    p_sex: value.sex,
    p_estimated_age: value.estimatedAge || "",
    p_breed: value.breed || "",
    p_colour: value.colour || "",
    p_size: value.size,
    p_distinguishing_features: value.distinguishingFeatures || "",
    p_found_at: value.foundAt,
    p_found_location_label: value.foundLocationLabel,
    p_vaccination_status: value.vaccinationStatus,
    p_sterilisation_status: value.sterilisationStatus,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/paws");
  revalidatePath("/admin/moderation");
}
