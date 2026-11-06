import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Flag, MapPin, PawPrint, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { dogs, events } from "@/lib/mock-data";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export function generateStaticParams() { return dogs.map(dog => ({ dogCode: dog.code })); }

export default async function DogProfilePage({ params }: { params: Promise<{ dogCode: string }> }) {
  const { dogCode } = await params;
  const dog = dogs.find(item => item.code === dogCode);
  if (!dog) notFound();

  return <><PublicHeader/><main>
    <div className="container-shell py-5 sm:py-6"><Link href="/dogs" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary)]"><ArrowLeft size={16}/>Back to paw directory</Link></div>
    <section className="container-shell grid min-w-0 gap-6 lg:grid-cols-[1.12fr_.88fr] lg:gap-8">
      <div className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-[16px] bg-[var(--primary-soft)] lg:aspect-[5/4]"><Image src={dog.image} alt={`${dog.name}, ${dog.breed}`} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover"/><span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--cocoa)] shadow-sm">Paw ID · {dog.code}</span></div>
      <div className="flex min-w-0 flex-col justify-center py-1 lg:py-2"><StatusBadge>{dog.status}</StatusBadge><h1 className="page-title mt-4">{dog.name}</h1><p className="mt-2 text-lg text-[var(--muted)]">{dog.breed}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[var(--line)] py-5 text-sm"><div><dt className="text-[var(--muted)]">Estimated age</dt><dd className="mt-1 font-bold">{dog.age}</dd></div><div><dt className="text-[var(--muted)]">Sex</dt><dd className="mt-1 font-bold">{dog.sex}</dd></div><div><dt className="text-[var(--muted)]">Size</dt><dd className="mt-1 font-bold">{dog.size}</dd></div><div><dt className="text-[var(--muted)]">Approximate area</dt><dd className="mt-1 font-bold">{dog.location}</dd></div></dl>
        <div className="mt-4 rounded-[12px] bg-[var(--primary-soft)] p-4 text-sm leading-6 text-[var(--cocoa)]"><strong>Location privacy:</strong> Paw Promise shows only an approximate public locality. Precise discovery locations remain restricted.</div>
        <ButtonLink href={`/dashboard/dogs/${dog.code}/events/new`} className="mt-4 w-full sm:w-fit">Add a care update</ButtonLink>
      </div>
    </section>

    <section className="container-shell mt-12 grid min-w-0 gap-7 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div className="min-w-0"><p className="eyebrow">Care history</p><h2 className="section-title mt-2">What has happened</h2><div className="relative mt-6 space-y-0 before:absolute before:bottom-4 before:left-[17px] before:top-3 before:w-px before:bg-[var(--line)]">{events.map((event,index)=><article key={event.title} className="relative grid min-w-0 grid-cols-[36px_minmax(0,1fr)] gap-3 pb-4 sm:gap-4 sm:pb-5"><span className="z-10 grid size-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--primary)]">{index===events.length-1?<PawPrint size={16}/>:<CheckCircle2 size={16}/>}</span><div className="card min-w-0 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge tone={event.type==="Veterinary visit"?"amber":"neutral"}>{event.type}</StatusBadge><span className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><CalendarDays size={14}/>{event.date}</span></div><h3 className="mt-3 text-lg font-bold">{event.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.detail}</p><p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><UserRound size={14}/>Recorded by {event.author}</p></div></article>)}</div></div>
      <aside className="grid gap-4 sm:grid-cols-2 lg:block lg:space-y-4"><div className="card p-5"><h2 className="font-bold">Known details</h2><dl className="mt-4 grid grid-cols-3 gap-3 text-sm sm:grid-cols-1 sm:gap-4"><div><dt className="text-[var(--muted)]">Vaccination</dt><dd className="font-semibold">Unknown</dd></div><div><dt className="text-[var(--muted)]">Sterilisation</dt><dd className="font-semibold">Unknown</dd></div><div><dt className="text-[var(--muted)]">First recorded</dt><dd className="font-semibold">24 Oct 2026</dd></div></dl></div><div className="card p-5"><MapPin className="text-[var(--primary)]"/><h2 className="mt-3 font-bold">Seen this pup?</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">A recent sighting can help community carers plan their next visit.</p><ButtonLink href={`/dashboard/dogs/${dog.code}/events/new`} variant="secondary" size="sm" className="mt-4 w-full">Record a sighting</ButtonLink></div><button className="flex items-center gap-2 px-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--primary-hover)]"><Flag size={16}/>Report a concern</button></aside>
    </section>
  </main><PublicFooter/></>;
}
