import { AlertTriangle, RefreshCw } from "lucide-react";
import { DogDirectory } from "@/components/dogs/dog-directory";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ButtonLink } from "@/components/ui/button";
import { getAuthenticatedIdentity } from "@/features/auth/authorization";
import { getPublishedPaws } from "@/features/paws/queries";

export const metadata = { title: "Paw directory" };

export default async function DogsPage() {
  const [pawsResult, viewer] = await Promise.all([
    getPublishedPaws()
      .then((paws) => ({ paws, unavailable: false as const }))
      .catch(() => ({ paws: [], unavailable: true as const })),
    getAuthenticatedIdentity(),
  ]);

  return (
    <>
      <PublicHeader viewer={viewer ? { fullName: viewer.fullName } : null} />
      <main className="container-shell min-w-0 py-8 sm:py-11 lg:py-12">
        <p className="eyebrow">Community paw directory</p>
        <div className="mt-3 max-w-3xl">
          <h1 className="page-title text-balance">Every paw has a story still being written.</h1>
          <p className="body-lg mt-4 max-w-2xl">Meet the pups and explore the published care histories our community has recorded.</p>
        </div>

        {pawsResult.unavailable ? (
          <section className="mt-8 border-y border-[var(--line)] px-2 py-11 text-center sm:mt-10 sm:py-14" role="alert">
            <AlertTriangle className="mx-auto text-[var(--primary)]" aria-hidden="true" size={28} />
            <h2 className="mt-5 text-2xl font-bold text-[var(--charcoal)]">The paw directory is temporarily unavailable</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-[var(--muted)]">
              We could not reach the community records. Your information is safe—please try again in a moment.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/paws">
                <RefreshCw aria-hidden="true" size={16} /> Try again
              </ButtonLink>
              <ButtonLink href="/" variant="secondary">Return home</ButtonLink>
            </div>
          </section>
        ) : (
          <div className="mt-7 sm:mt-9"><DogDirectory paws={pawsResult.paws} /></div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
