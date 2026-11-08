"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";

export default function PawsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Unable to render paw profiles", error);
  }, [error]);

  return (
    <>
      <PublicHeader />
      <main className="container-shell flex min-h-[58vh] items-center justify-center py-12 sm:py-16">
        <section className="w-full max-w-2xl rounded-[18px] border border-[var(--line)] bg-[var(--paper)] px-5 py-10 text-center sm:px-10 sm:py-14" role="alert">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
            <AlertTriangle aria-hidden="true" size={23} />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-[var(--charcoal)] sm:text-3xl">This paw profile did not load</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-[var(--muted)]">
            The connection may have been interrupted. Try once more, or return to the directory.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={retry}>
              <RefreshCw aria-hidden="true" size={16} /> Try again
            </Button>
            <Link className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-[var(--line)] px-5 font-semibold text-[var(--charcoal)] hover:bg-[var(--ivory)]" href="/paws">
              Paw directory
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
