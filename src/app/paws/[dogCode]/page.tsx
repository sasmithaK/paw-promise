import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ImageIcon, MapPin, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ButtonLink } from "@/components/ui/button";
import { EventReportForm } from "@/components/dogs/event-report-form";
import { getAuthenticatedIdentity } from "@/features/auth/authorization";
import { getPublishedPaw, getPublishedPawEvents } from "@/features/paws/queries";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string | null) => value ? value.toLowerCase().replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase()) : "Unknown";

export default async function PawProfilePage({ params }: { params: Promise<{ dogCode: string }> }) {
  const { dogCode } = await params;
  const paw = await getPublishedPaw(dogCode);
  if (!paw) notFound();

  const [events, viewer] = await Promise.all([getPublishedPawEvents(paw.id), getAuthenticatedIdentity()]);

  return (
    <>
      <PublicHeader viewer={viewer ? { fullName: viewer.fullName } : null} />
      <main className="container-shell min-w-0 pb-10 sm:pb-14">
        <div className="py-5 sm:py-6">
          <Link href="/paws" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary)]">
            <ArrowLeft size={16} /> Back to paw directory
          </Link>
        </div>

        <section className="grid min-w-0 gap-7 border-b border-[var(--line)] pb-9 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-12 lg:pb-12">
          <div className="relative grid aspect-[4/3] min-w-0 place-items-center overflow-hidden rounded-[12px] bg-[var(--primary-soft)] lg:aspect-[5/4]">
            {paw.imageUrl ? (
              <Image src={paw.imageUrl} alt={`${paw.name}${paw.breed ? `, ${paw.breed}` : ""}`} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            ) : (
              <ImageIcon size={52} className="text-[var(--primary)]" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.11em] text-[var(--primary)]">Published record · {paw.code}</p>
            <h1 className="page-title mt-3">{paw.name}</h1>
            <p className="mt-2 text-lg text-[var(--muted)]">{paw.breed || "Breed unknown"}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--line)] py-5 text-sm">
              <Detail term="Estimated age" value={paw.estimatedAge || "Unknown"} />
              <Detail term="Sex" value={label(paw.sex)} />
              <Detail term="Size" value={label(paw.size)} />
              <Detail term="Approximate area" value={paw.location} />
              <Detail term="Vaccination" value={label(paw.vaccinationStatus)} />
              <Detail term="Sterilisation" value={label(paw.sterilisationStatus)} />
            </dl>

            <p className="mt-5 flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 shrink-0 text-[var(--primary)]" size={18} />
              Public profiles show an approximate locality. Precise coordinates and private evidence remain restricted.
            </p>
            <ButtonLink href={`/dashboard/paws/${paw.code}/events/new`} className="mt-5 w-full sm:w-fit">Add a care update</ButtonLink>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-4xl sm:mt-12">
          <div className="flex flex-col gap-2 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Care history</p>
              <h2 className="section-title mt-2">What has happened</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">{events.length} public {events.length === 1 ? "entry" : "entries"} · First recorded {formatDate(paw.foundAt)}</p>
          </div>

          {events.length ? (
            <div className="divide-y divide-[var(--line)]">
              {events.map((event) => (
                <article key={event.id} className="grid min-w-0 gap-3 py-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-7 sm:py-7">
                  <div className="text-xs leading-5 text-[var(--muted)]">
                    <p className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(event.occurredAt)}</p>
                    <p className="mt-1 font-semibold text-[var(--charcoal)]">{label(event.verificationStatus)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">{label(event.type)}</p>
                    <h3 className="mt-2 text-xl font-bold tracking-[-.02em]">{event.title}</h3>
                    {event.description && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.description}</p>}
                    {event.location && <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]"><MapPin size={14} />{event.location}</p>}
                    <EventReportForm dogId={paw.id} eventId={event.id} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-b border-[var(--line)] py-10 text-center">
              <h3 className="font-bold">No public care updates yet</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">The first verified community update will appear here.</p>
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[var(--muted)]">{term}</dt><dd className="mt-1 break-words font-bold">{value}</dd></div>;
}
