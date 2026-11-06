"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function PasswordPanel({ mode }: { mode: "request" | "reset" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode === "reset" && password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    if (mode === "request") {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/reset-password");
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
      setPending(false);
      if (requestError) setError(requestError.message);
      else setMessage("If an account exists for that address, a recovery link is on its way.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login?message=password-updated");
    router.refresh();
  }

  const isRequest = mode === "request";
  return <main className="min-h-screen bg-[var(--paper)] px-5 py-6 sm:px-10">
    <Brand/>
    <section className="mx-auto mt-16 max-w-[460px] rounded-[16px] border border-[var(--line)] bg-white p-6 shadow-sm sm:mt-24 sm:p-8">
      <span className="grid size-11 place-items-center rounded-[11px] bg-[var(--primary-soft)] text-[var(--primary-hover)]">{isRequest ? <Mail size={20}/> : <KeyRound size={20}/>}</span>
      <h1 className="mt-5 text-3xl font-bold tracking-[-.04em]">{isRequest ? "Reset your password" : "Choose a new password"}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{isRequest ? "Enter the email address on your account and we’ll send a secure recovery link." : "Use at least eight characters. You’ll sign in again after the password is changed."}</p>
      <form className="mt-7 grid gap-4" onSubmit={submit}>
        {isRequest ? <label className="grid gap-2 text-sm font-semibold">Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="h-12 rounded-[10px] border border-[var(--line)] px-3 font-normal"/></label> : <>
          <label className="grid gap-2 text-sm font-semibold">New password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="h-12 rounded-[10px] border border-[var(--line)] px-3 font-normal"/></label>
          <label className="grid gap-2 text-sm font-semibold">Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="h-12 rounded-[10px] border border-[var(--line)] px-3 font-normal"/></label>
        </>}
        {error && <p role="alert" className="rounded-[8px] bg-[#f3d8d0] px-3 py-2 text-sm font-semibold text-[#8c3f2e]">{error}</p>}
        {message && <p role="status" className="flex gap-2 rounded-[8px] bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary-hover)]"><CheckCircle2 className="shrink-0" size={17}/>{message}</p>}
        <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={17}/>Please wait</> : isRequest ? "Send recovery link" : "Update password"}</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-[var(--primary-hover)] hover:underline">Back to sign in</Link></p>
    </section>
  </main>;
}
