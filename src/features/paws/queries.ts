import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type PublishedPawRow = Database["public"]["Views"]["published_paw_profiles"]["Row"];

export type PawSummary = {
  id: string;
  code: string;
  name: string;
  sex: "MALE" | "FEMALE" | "UNKNOWN";
  estimatedAge: string | null;
  breed: string | null;
  colour: string | null;
  size: string | null;
  distinguishingFeatures: string | null;
  foundAt: string;
  location: string;
  vaccinationStatus: string | null;
  sterilisationStatus: string | null;
  imageUrl: string | null;
  eventCount: number;
  latestEventAt: string | null;
};

export type PawEvent = {
  id: string;
  type: Database["public"]["Enums"]["dog_event_type"];
  title: string;
  description: string | null;
  occurredAt: string;
  location: string | null;
  verificationStatus: Database["public"]["Enums"]["verification_status"];
};

export function publicPhotoUrl(path: string | null) {
  if (!path) return null;
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${getPublicSupabaseEnv().url}/storage/v1/object/public/dog-public-photos/${safePath}`;
}

function toPawSummary(row: PublishedPawRow): PawSummary | null {
  if (!row.id || !row.paw_code || !row.found_at || !row.found_location_label || !row.sex) return null;
  return {
    id: row.id,
    code: row.paw_code,
    name: row.name?.trim() || "Unnamed pup",
    sex: row.sex,
    estimatedAge: row.estimated_age,
    breed: row.breed,
    colour: row.colour,
    size: row.size,
    distinguishingFeatures: row.distinguishing_features,
    foundAt: row.found_at,
    location: row.found_location_label,
    vaccinationStatus: row.vaccination_status,
    sterilisationStatus: row.sterilisation_status,
    imageUrl: publicPhotoUrl(row.primary_photo_path),
    eventCount: Number(row.event_count ?? 0),
    latestEventAt: row.latest_event_at,
  };
}

export async function getPublishedPaws(limit?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("published_paw_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load published paw profiles: ${error.message}`);
  return data.map(toPawSummary).filter((paw): paw is PawSummary => paw !== null);
}

export async function getPublishedPaw(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("published_paw_profiles")
    .select("*")
    .eq("paw_code", code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(`Unable to load this paw profile: ${error.message}`);
  return data ? toPawSummary(data) : null;
}

export async function getPublishedPawEvents(dogId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("published_dog_events")
    .select("id,event_type,title,description,occurred_at,location_label,verification_status")
    .eq("dog_id", dogId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(`Unable to load care history: ${error.message}`);
  return data.flatMap((row): PawEvent[] => {
    if (!row.id || !row.event_type || !row.title || !row.occurred_at || !row.verification_status) return [];
    return [{
      id: row.id,
      type: row.event_type,
      title: row.title,
      description: row.description,
      occurredAt: row.occurred_at,
      location: row.location_label,
      verificationStatus: row.verification_status,
    }];
  });
}

export type PendingPaw = {
  id: string;
  code: string;
  name: string;
  location: string;
  submittedAt: string;
  submittedBy: string;
  imageUrl: string | null;
  changesRequestedNote: string | null;
};

export async function getPendingPawsForModeration() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dogs")
    .select("id,dog_code,name,found_location_label,created_at,changes_requested_note,profiles!dogs_created_by_fkey(full_name),dog_photos(storage_path,is_primary)")
    .eq("record_status", "PENDING")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Unable to load pending profiles: ${error.message}`);

  return Promise.all(data.map(async row => {
    const primary = row.dog_photos.find(photo => photo.is_primary);
    const signed = primary ? await supabase.storage.from("dog-private-photos").createSignedUrl(primary.storage_path, 900) : null;
    return {
      id: row.id,
      code: `PP-${String(row.dog_code).padStart(6, "0")}`,
      name: row.name?.trim() || "Unnamed pup",
      location: row.found_location_label,
      submittedAt: row.created_at,
      submittedBy: row.profiles?.full_name || "Community member",
      imageUrl: signed?.data?.signedUrl ?? null,
      changesRequestedNote: row.changes_requested_note,
    } satisfies PendingPaw;
  }));
}
