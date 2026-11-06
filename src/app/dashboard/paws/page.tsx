import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, ImageIcon, Plus, ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { publicPhotoUrl } from "@/features/paws/queries";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));

export default async function ManagedPawsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const identity = await requireActiveIdentity();
  const supabase = await createClient();
  const { tab } = await searchParams;

  const isStaff = identity.roles.some((r) => r === "SUPER_ADMIN" || r === "MODERATOR");
  const showAll = isStaff && tab !== "mine";

  let query = supabase
    .from("dogs")
    .select(
      "id,dog_code,name,record_status,updated_at,changes_requested_note,created_by,profiles!dogs_created_by_fkey(full_name),dog_photos(storage_path,is_primary,visibility)",
    )
    .order("created_at", { ascending: false });

  query = query.neq("dog_code", 15); if (!showAll) { query = query.eq("created_by", identity.id); }

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load paw profiles: ${error.message}`);

  const paws = await Promise.all(
    (data || []).map(async (paw) => {
      const photo = paw.dog_photos?.find((item) => item.is_primary);
      let imageUrl: string | null = null;
      if (photo) {
        if (photo.visibility === "PUBLIC") {
          imageUrl = publicPhotoUrl(photo.storage_path);
        } else {
          const signed = await supabase.storage
            .from("dog-private-photos")
            .createSignedUrl(photo.storage_path, 900);
          imageUrl = signed.data?.signedUrl ?? null;
        }
      }
      return { ...paw, imageUrl };
    }),
  );

  return (
    <WorkspaceShell>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Paw records</p>
          <h1 className="page-title mt-2">
            {showAll ? "All community paw profiles" : "Your paw profiles"}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {showAll
              ? "All registered pup profiles across the community, including pending reviews."
              : "Profiles you introduced, including records still awaiting review."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/paws" variant="secondary">
            <Compass size={16} />
            Explore directory
          </ButtonLink>
          <ButtonLink href="/paws/new">
            <Plus size={17} />
            Introduce a pup
          </ButtonLink>
        </div>
      </div>

      {isStaff && (
        <div className="mt-6 flex border-b border-[var(--line)]">
          <Link
            href="/dashboard/paws"
            className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              showAll
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--charcoal)]"
            }`}
          >
            All community paws
          </Link>
          <Link
            href="/dashboard/paws?tab=mine"
            className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              !showAll
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--charcoal)]"
            }`}
          >
            My introductions
          </Link>
        </div>
      )}

      {paws.length ? (
        <div className="card mt-7 overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-[var(--line)] bg-[#fff5ed] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)] md:grid">
            <span>Paw profile</span>
            <span>Introduced by</span>
            <span>Review status</span>
            <span className="text-right">Action</span>
          </div>
          {paws.map((paw) => {
            const formattedCode = `PP-${String(paw.dog_code).padStart(6, "0")}`;
            const targetHref =
              paw.record_status === "PUBLISHED"
                ? `/paws/${formattedCode}`
                : isStaff
                  ? "/admin/moderation"
                  : "/dashboard/paws";
            const submitter = paw.profiles?.full_name || "Community member";

            return (
              <div
                key={paw.id}
                className="grid gap-3 border-b border-[var(--line)] p-4 last:border-0 hover:bg-[#fff7f0] md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4 md:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--primary-soft)]">
                    {paw.imageUrl ? (
                      <Image
                        src={paw.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon size={20} className="text-[var(--primary)]" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{paw.name || "Unnamed pup"}</p>
                    <p className="text-xs text-[var(--muted)]">Paw ID · {formattedCode}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{submitter}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(paw.updated_at)}</p>
                </div>

                <div>
                  <StatusBadge
                    tone={
                      paw.record_status === "PUBLISHED"
                        ? "sage"
                        : paw.record_status === "REJECTED" || paw.changes_requested_note
                          ? "red"
                          : "amber"
                    }
                  >
                    {paw.changes_requested_note ? "Changes requested" : paw.record_status}
                  </StatusBadge>
                  {paw.changes_requested_note && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {paw.changes_requested_note}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  {paw.record_status === "PUBLISHED" ? (
                    <Link
                      href={targetHref}
                      className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary-hover)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                    >
                      View profile <ArrowRight size={14} />
                    </Link>
                  ) : isStaff ? (
                    <Link
                      href="/admin/moderation"
                      className="inline-flex items-center gap-1 rounded-[8px] bg-[#fff0e5] px-3 py-1.5 text-xs font-bold text-[var(--primary-hover)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                    >
                      <ShieldCheck size={14} /> Review queue
                    </Link>
                  ) : (
                    <span className="text-xs italic text-[var(--muted)]">Awaiting review</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card mt-7 p-10 text-center">
          <h2 className="text-xl font-bold">
            {showAll ? "No paw profiles found." : "You have not introduced a pup yet."}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
            {showAll
              ? "No paw records have been introduced yet."
              : "Create a paw profile with a photograph and discovery information. It will remain private until moderation is complete."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <ButtonLink href="/paws/new">Introduce a pup</ButtonLink>
            <ButtonLink href="/paws" variant="secondary">
              Explore community paws
            </ButtonLink>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
