import Image from "next/image";
import Link from "next/link";
import { ImageIcon, MapPin, NotebookTabs } from "lucide-react";
import type { PawSummary } from "@/features/paws/queries";

function formatActivity(value: string | null) {
  if (!value) return "No care updates yet";
  return `Updated ${new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value))}`;
}

export function DogCard({ dog }: { dog: PawSummary }) {
  return (
    <article className="min-w-0">
      <Link
        href={`/paws/${dog.code}`}
        className="focus-ring grid h-full overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--paper)] transition-colors hover:border-[var(--primary-soft-strong)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--primary-soft)] sm:aspect-[4/3]">
          {dog.imageUrl ? (
            <Image
              src={dog.imageUrl}
              alt={`${dog.name}${dog.breed ? `, ${dog.breed}` : ""}`}
              fill
              sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-[var(--primary)]">
              <ImageIcon size={40} />
              <span className="sr-only">No public photograph available</span>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col px-4 pb-4 pt-3.5 sm:min-h-[190px] sm:px-5 sm:pb-5 sm:pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[var(--muted)]">{dog.code}</p>
          <h3 className="mt-1 text-[1.45rem] font-bold tracking-[-.04em] text-[var(--charcoal)] sm:text-[1.6rem]">{dog.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{dog.breed || "Breed unknown"} · {dog.estimatedAge || "Age unknown"}</p>

          <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
            <p className="flex min-w-0 items-center gap-2">
              <MapPin size={14} className="shrink-0 text-[var(--primary)]" />
              <span className="truncate">{dog.location}</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-[var(--muted)] sm:mt-auto sm:pt-4">
            <span className="flex items-center gap-2 font-semibold text-[var(--charcoal)]">
              <NotebookTabs size={14} className="text-[var(--primary)]" />
              {dog.eventCount} {dog.eventCount === 1 ? "care update" : "care updates"}
            </span>
            <span>{formatActivity(dog.latestEventAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
