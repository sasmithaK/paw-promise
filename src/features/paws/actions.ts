"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveIdentity, requireModeratorIdentity } from "@/features/auth/authorization";
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
  if (value.decision === "REQUEST_CHANGES" && !value.note) {
    context.addIssue({ code: "custom", path: ["note"], message: "Explain what needs to change." });
  }
});

export async function moderatePawAction(formData: FormData) {
  const identity = await requireModeratorIdentity();
  const parsed = moderationInputSchema.safeParse({
    dogId: formData.get("dogId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid moderation request");

  const { dogId, decision, note } = parsed.data;
  const supabase = await createClient();
  const { data: paw, error: pawError } = await supabase.from("dogs").select("id,created_by,record_status").eq("id", dogId).single();
  if (pawError || !paw) throw new Error("The paw profile could not be loaded.");
  if (paw.created_by === identity.id) throw new Error("You cannot review your own submission.");
  if (paw.record_status !== "PENDING") throw new Error("This profile is no longer pending review.");

  let publishedPhotoPath: string | null = null;
  let photoId: string | null = null;
  if (decision === "PUBLISH") {
    const { data: photo, error: photoError } = await supabase.from("dog_photos").select("id,storage_path").eq("dog_id", dogId).eq("is_primary", true).single();
    if (photoError || !photo) throw new Error("A primary photograph is required before publication.");
    const { data: privatePhoto, error: downloadError } = await supabase.storage.from("dog-private-photos").download(photo.storage_path);
    if (downloadError || !privatePhoto) throw new Error("The private photograph could not be prepared for publication.");
    const { error: uploadError } = await supabase.storage.from("dog-public-photos").upload(photo.storage_path, privatePhoto, { contentType: privatePhoto.type, upsert: false });
    if (uploadError) throw new Error(`The public photograph could not be created: ${uploadError.message}`);
    publishedPhotoPath = photo.storage_path;
    photoId = photo.id;
    const { error: photoUpdateError } = await supabase.from("dog_photos").update({ visibility: "PUBLIC" }).eq("id", photo.id);
    if (photoUpdateError) {
      await supabase.storage.from("dog-public-photos").remove([photo.storage_path]);
      throw new Error("The photograph approval could not be saved.");
    }
  }

  const { error } = await supabase.rpc("moderate_paw", { p_dog_id: dogId, p_decision: decision, p_note: note || undefined });
  if (error) {
    if (publishedPhotoPath) await supabase.storage.from("dog-public-photos").remove([publishedPhotoPath]);
    if (photoId) await supabase.from("dog_photos").update({ visibility: "PRIVATE" }).eq("id", photoId);
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/paws");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/dashboard/paws");
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
