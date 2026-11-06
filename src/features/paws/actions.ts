"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveIdentity, requireModeratorIdentity } from "@/features/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { dogRegistrationSchema } from "@/lib/validation/dog-registration";
import { eventCreationSchema } from "@/lib/validation/event";
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
  revalidatePath("/dogs");
  revalidatePath("/dashboard/dogs");
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
  revalidatePath("/dogs");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/dashboard/dogs");
}

export type PawEventResult = { ok: true } | { ok: false; message: string };

export async function createPawEventAction(input: unknown): Promise<PawEventResult> {
  const identity = await requireActiveIdentity();
  const parsed = eventCreationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Review the care update." };
  const value = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("dog_events").insert({
    dog_id: value.dogId,
    event_type: value.eventType,
    title: value.title,
    description: value.description || null,
    occurred_at: value.occurredAt,
    location_label: value.locationLabel || null,
    visibility: value.visibility,
    details: value.details as Json,
    created_by: identity.id,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/activities");
  revalidatePath("/dogs");
  return { ok: true };
}
