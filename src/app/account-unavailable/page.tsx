"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AccountUnavailablePage() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return <main className="min-h-screen bg-[var(--paper)] px-5 py-6 sm:px-10"><Brand/><section className="mx-auto mt-20 max-w-lg text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#f3d8d0] text-[#8c3f2e]"><ShieldAlert/></span><h1 className="mt-6 text-4xl font-bold tracking-[-.05em]">This account is unavailable</h1><p className="mt-4 leading-7 text-[var(--muted)]">Your account is suspended or disabled. Contact a Paw Promise administrator if you believe this is a mistake.</p><Button className="mt-7" onClick={signOut}>Sign out</Button></section></main>;
}
