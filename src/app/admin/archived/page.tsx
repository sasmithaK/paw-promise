import Image from "next/image";
import Link from "next/link";
import { Archive, ArrowRight, ImageIcon, ShieldAlert } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireModeratorIdentity } from "@/features/auth/authorization";
import { getPawDisplayName } from "@/lib/dog-code";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());

export default async function ArchivedPawsPage() {
  await requireModeratorIdentity();
  const supabase = await createClient();
  const { data, error } = await supabase.from("dogs").select("id,dog_code,name,archived_at,archive_category,archive_reason,archive_cleanup_pending,previous_record_status,creator:profiles!dogs_created_by_fkey(full_name),archiver:profiles!dogs_archived_by_fkey(full_name),dog_photos(storage_path,is_primary)").eq("record_status", "ARCHIVED").order("archived_at", { ascending: false });
  if (error) throw new Error(`Unable to load archived paw records: ${error.message}`);

  const paws = await Promise.all(data.map(async (paw) => {
    const photo = paw.dog_photos.find((item) => item.is_primary);
    const signed = photo ? await supabase.storage.from("dog-private-photos").createSignedUrl(photo.storage_path, 900) : null;
    return { ...paw, imageUrl: signed?.data?.signedUrl || null };
  }));

  return <WorkspaceShell admin>
    <div><p className="eyebrow">Record governance</p><h1 className="page-title mt-3">Archived paw records</h1><p className="mt-3 max-w-3xl text-[var(--muted)]">Removed profiles stay out of public and member workflows while their permanent Paw IDs, histories, evidence, and audit records remain available to authorised staff.</p></div>
    {paws.length ? <div className="mt-7 grid gap-4">{paws.map((paw) => {
      const pawCode = `PP-${String(paw.dog_code).padStart(6, "0")}`;
      return <article key={paw.id} className="card grid gap-4 p-5 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
        <span className="relative grid size-[72px] place-items-center overflow-hidden rounded-[12px] bg-[var(--primary-soft)]">{paw.imageUrl ? <Image src={paw.imageUrl} alt="" fill sizes="72px" className="object-cover"/> : <ImageIcon className="text-[var(--primary)]"/>}</span>
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{getPawDisplayName(paw.name, pawCode)}</h2><StatusBadge tone="red">Archived</StatusBadge>{paw.archive_cleanup_pending && <StatusBadge tone="amber">Photo cleanup pending</StatusBadge>}</div><p className="mt-1 text-sm font-semibold text-[var(--muted)]">{pawCode} · Previously {label(paw.previous_record_status || "PENDING")}</p><p className="mt-3 text-sm leading-6">{paw.archive_reason}</p><p className="mt-2 text-xs text-[var(--muted)]">{paw.archive_category ? label(paw.archive_category) : "Other"} · Removed {paw.archived_at ? formatDate(paw.archived_at) : "recently"} by {paw.archiver?.full_name || "Authorised staff"} · Introduced by {paw.creator?.full_name || "Community member"}</p></div>
        <Link href={`/dashboard/paws/${pawCode}`} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--primary-hover)] hover:border-[var(--primary)]">Review record <ArrowRight size={15}/></Link>
      </article>;
    })}</div> : <div className="card mt-7 p-10 text-center"><Archive className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No archived paw records</h2><p className="mt-2 text-sm text-[var(--muted)]">Records removed by Moderators or Super Admins will appear here.</p></div>}
    <div className="mt-5 flex gap-3 rounded-[12px] bg-[#fff2e9] p-4 text-sm leading-6 text-[var(--cocoa)]"><ShieldAlert className="mt-0.5 shrink-0" size={19}/><p>Restoration is restricted to Super Admins and always returns a profile to pending review. Archived histories are never silently rewritten.</p></div>
  </WorkspaceShell>;
}
