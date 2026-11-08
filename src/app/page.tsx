import Image from "next/image";
import { ArrowRight, Binoculars, ClipboardCheck, HeartHandshake, MapPinned, NotebookTabs, PawPrint, ShieldCheck, Stethoscope } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ButtonLink } from "@/components/ui/button";
import { getAuthenticatedIdentity } from "@/features/auth/authorization";

const waysToHelp = [
  { icon: MapPinned, title: "Introduce a paw", description: "Create a clear identity and discovery record for a pup in your community." },
  { icon: Binoculars, title: "Record a sighting", description: "Add where and when a pup was seen so the next carer has useful context." },
  { icon: HeartHandshake, title: "Add community care", description: "Preserve feeding, rescue, treatment, and other acts of practical support." },
  { icon: NotebookTabs, title: "Follow the history", description: "Keep every attributed update together in one dependable chronological record." },
];

export default async function HomePage() {
  const viewer = await getAuthenticatedIdentity();

  return <>
    <PublicHeader viewer={viewer ? { fullName: viewer.fullName } : null}/>
    <main>
      <section className="overflow-hidden border-b border-[var(--line)]">
        <div className="container-shell grid min-h-[620px] items-center gap-10 py-10 lg:grid-cols-[.96fr_1.04fr] lg:gap-14 lg:py-14">
          <div className="max-w-2xl py-4">
            <p className="eyebrow">A community record of care</p>
            <h1 className="display mt-5 text-balance">Every paw leaves a story worth caring for.</h1>
            <p className="body-lg mt-6 max-w-xl">Paw Promise helps neighbours and volunteers turn everyday observations and acts of kindness into one trusted history for local pups.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/paws" size="lg">Explore paw profiles <ArrowRight size={18}/></ButtonLink>
              <ButtonLink href={viewer ? "/paws/new" : "/register"} variant="secondary" size="lg">{viewer ? "Introduce a paw" : "Join the community"}</ButtonLink>
            </div>
            <div className="mt-9 flex max-w-lg items-start gap-3 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 shrink-0 text-[var(--primary)]" size={20}/>
              <p>Public profiles are independently reviewed. Sensitive evidence and exact location history remain inside the authenticated workspace.</p>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[520px]">
            <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-[28px] bg-[var(--primary)] sm:left-8">
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 18px 18px, rgba(255,255,255,.7) 2px, transparent 2.5px)", backgroundSize: "54px 54px" }}/>
            </div>
            <div className="absolute inset-x-5 bottom-8 top-0 overflow-hidden rounded-[22px] border-[6px] border-[var(--paper)] bg-[var(--primary-soft)] shadow-soft sm:left-0 sm:right-8">
              <Image src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1500&q=88" alt="A friendly dog looking toward the camera" fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover object-center"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c2925]/35 via-transparent to-transparent"/>
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--cocoa)] shadow-soft sm:left-6 sm:top-6"><PawPrint size={15} className="text-[var(--primary)]"/>Community care, recorded</span>
            </div>
            <div className="absolute bottom-0 right-0 max-w-[250px] rounded-[14px] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[.11em] text-[var(--primary)]">A living history</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">One profile keeps discovery, sightings, care, and follow-ups connected.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--paper)] py-14 sm:py-16">
        <div className="container-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow">Ways to contribute</p><h2 className="section-title mt-3 max-w-2xl">Small actions build a clearer picture.</h2></div>
            <ButtonLink href="/about#how-it-works" variant="secondary">How Paw Promise works <ArrowRight size={17}/></ButtonLink>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {waysToHelp.map(({ icon: Icon, title, description }, index) => <article key={title} className="group rounded-[16px] border border-[var(--line)] bg-[var(--ivory)] p-5 transition hover:-translate-y-1 hover:border-[var(--primary-soft-strong)]">
              <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)]"><Icon size={20}/></span><span className="text-xs font-bold text-[var(--muted)]">0{index + 1}</span></div>
              <h3 className="mt-7 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="container-shell grid items-center gap-9 py-14 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[var(--primary-soft)]">
          <Image src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1500&q=86" alt="A person caring for a dog outdoors" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/>
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[12px] bg-[var(--paper)]/95 p-4 shadow-soft sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs"><ClipboardCheck className="shrink-0 text-[var(--primary)]"/><p className="text-sm font-semibold leading-5">Care becomes more useful when the next person can understand what happened.</p></div>
        </div>
        <div><p className="eyebrow">Built for continuity</p><h2 className="section-title mt-3 text-balance">Not a listing. A shared memory for community care.</h2><p className="body-lg mt-5">Each paw profile preserves a chronological story instead of scattering information across messages, people, and places.</p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="border-t border-[var(--line)] pt-4"><Stethoscope className="text-[var(--primary)]" size={21}/><h3 className="mt-3 font-bold">Clear care context</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Observations, treatment records, and follow-ups stay distinct and understandable.</p></div>
            <div className="border-t border-[var(--line)] pt-4"><ShieldCheck className="text-[var(--primary)]" size={21}/><h3 className="mt-3 font-bold">Accountable by design</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Contributions are attributed, moderation is independent, and sensitive actions are auditable.</p></div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--cocoa)] py-14 text-white sm:py-16">
        <div className="container-shell grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary-soft-strong)]">How it works</p><h2 className="section-title mt-4 max-w-xl text-balance">A simple path from first sighting to continued care.</h2></div>
          <ol className="grid gap-1">
            <li className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/15 py-5"><span className="text-sm font-bold text-[var(--primary-soft-strong)]">01</span><div><h3 className="font-bold">Create the first record</h3><p className="mt-1 text-sm leading-6 text-white/65">Add a clear photograph, accurate discovery location, and what you observed.</p></div></li>
            <li className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/15 py-5"><span className="text-sm font-bold text-[var(--primary-soft-strong)]">02</span><div><h3 className="font-bold">Review before publication</h3><p className="mt-1 text-sm leading-6 text-white/65">A moderator checks identity, privacy, and clarity before the profile becomes public.</p></div></li>
            <li className="grid grid-cols-[42px_1fr] gap-4 py-5"><span className="text-sm font-bold text-[var(--primary-soft-strong)]">03</span><div><h3 className="font-bold">Keep the history growing</h3><p className="mt-1 text-sm leading-6 text-white/65">Members add sightings and care updates without overwriting earlier contributions.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="container-shell py-14 sm:py-16">
        <div className="overflow-hidden rounded-[22px] bg-[var(--primary)] px-6 py-10 text-center text-white sm:px-10 sm:py-14">
          <PawPrint className="mx-auto text-white/80" size={30}/><p className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-white/75">A shared promise</p><h2 className="section-title mx-auto mt-3 max-w-3xl text-balance">Help the next carer understand what this pup needs.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-white/80">Join Paw Promise to introduce a pup or contribute to an existing community care history.</p>
          <ButtonLink href={viewer ? "/dashboard" : "/register"} variant="secondary" size="lg" className="mt-7 border-white/30 bg-white text-[var(--primary-hover)] hover:bg-[var(--paper)]">{viewer ? "Open your workspace" : "Become a member"}</ButtonLink>
        </div>
      </section>
    </main>
    <PublicFooter/>
  </>;
}
