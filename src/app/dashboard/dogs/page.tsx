import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { publicPhotoUrl } from "@/features/paws/queries";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));

export default async function ManagedPawsPage() {
  const identity = await requireActiveIdentity();
  const supabase = await createClient();
  const { data, error } = await supabase.from("dogs").select("id,dog_code,name,record_status,updated_at,changes_requested_note,dog_photos(storage_path,is_primary,visibility)").eq("created_by", identity.id).order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load your paw profiles: ${error.message}`);
  const paws = await Promise.all(data.map(async paw => {
    const photo = paw.dog_photos.find(item => item.is_primary);
    const imageUrl = !photo ? null : photo.visibility === "PUBLIC" ? publicPhotoUrl(photo.storage_path) : (await supabase.storage.from("dog-private-photos").createSignedUrl(photo.storage_path, 900)).data?.signedUrl ?? null;
    return { ...paw, imageUrl };
  }));
  return <WorkspaceShell><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Paw records</p><h1 className="page-title mt-2">Your paw profiles</h1><p className="mt-2 text-[var(--muted)]">Profiles you introduced, including records still awaiting review.</p></div><ButtonLink href="/dogs/new"><Plus size={17}/>Introduce a pup</ButtonLink></div>
    {paws.length ? <div className="card mt-7 overflow-hidden"><div className="hidden grid-cols-[2fr_1fr_1fr] gap-4 border-b border-[var(--line)] bg-[#fff5ed] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)] md:grid"><span>Paw profile</span><span>Last updated</span><span>Review status</span></div>{paws.map(paw=><Link key={paw.id} href={paw.record_status==="PUBLISHED"?`/dogs/PP-${String(paw.dog_code).padStart(6,"0")}`:"/dashboard/dogs"} className="grid gap-3 border-b border-[var(--line)] p-4 last:border-0 hover:bg-[#fff7f0] md:grid-cols-[2fr_1fr_1fr] md:items-center md:gap-4 md:p-5"><div className="flex min-w-0 items-center gap-3"><span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--primary-soft)]">{paw.imageUrl?<Image src={paw.imageUrl} alt="" fill sizes="56px" className="object-cover"/>:<ImageIcon size={20} className="text-[var(--primary)]"/>}</span><div className="min-w-0"><p className="truncate font-bold">{paw.name || "Unnamed pup"}</p><p className="text-xs text-[var(--muted)]">Paw ID · PP-{String(paw.dog_code).padStart(6,"0")}</p></div></div><p className="text-sm text-[var(--muted)]">{formatDate(paw.updated_at)}</p><div><StatusBadge tone={paw.record_status==="PUBLISHED"?"sage":paw.record_status==="REJECTED"||paw.changes_requested_note?"red":"amber"}>{paw.changes_requested_note?"Changes requested":paw.record_status}</StatusBadge>{paw.changes_requested_note&&<p className="mt-1 text-xs text-[var(--muted)]">{paw.changes_requested_note}</p>}</div></Link>)}</div> : <div className="card mt-7 p-10 text-center"><h2 className="text-xl font-bold">You have not introduced a pup yet.</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">Create a paw profile with a photograph and discovery information. It will remain private until moderation is complete.</p><ButtonLink href="/dogs/new" className="mt-5">Introduce a pup</ButtonLink></div>}
  </WorkspaceShell>;
}
