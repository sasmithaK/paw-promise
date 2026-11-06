"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function AuthPanel({ mode, nextPath, initialMessage }: { mode: "login" | "register"; nextPath?: string; initialMessage?: string }) {
  const register = mode === "register";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    const supabase = createClient();

    if (register) {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNextPath(nextPath));
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback.toString(), data: { full_name: fullName.trim() } },
      });
      setPending(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        router.replace(safeNextPath(nextPath));
        router.refresh();
        return;
      }
      setMessage("Check your email to verify your address, then return here to continue.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "The email or password is incorrect." : signInError.message);
      return;
    }
    router.replace(safeNextPath(nextPath));
    router.refresh();
  }

  return <main className="grid min-h-screen lg:grid-cols-[1fr_.9fr]">
    <section className="flex flex-col bg-[var(--paper)] px-5 py-6 sm:px-10 lg:px-16">
      <Brand/>
      <div className="mx-auto my-auto w-full max-w-[430px] py-8">
        <p className="eyebrow">{register ? "Join the community" : "Welcome back"}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.05em]">{register ? "Create your account" : "Sign in to Paw Promise"}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{register ? "Every account starts with Member access. Privileged roles are assigned separately by an administrator." : "Continue recording care and following the paws you support."}</p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          {register && <label className="grid gap-2 text-sm font-semibold">Full name<input className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" autoComplete="name" placeholder="Your name" value={fullName} onChange={event => setFullName(event.target.value)} required minLength={1} maxLength={120}/></label>}
          <label className="grid gap-2 text-sm font-semibold">Email address<input type="email" className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required/></label>
          <label className="grid gap-2 text-sm font-semibold">Password<input type="password" className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" autoComplete={register ? "new-password" : "current-password"} placeholder="At least 8 characters" value={password} onChange={event => setPassword(event.target.value)} required minLength={8}/></label>
          {!register && <div className="-mt-1 text-right"><Link href="/forgot-password" className="text-sm font-bold text-[var(--primary-hover)] hover:underline">Forgot password?</Link></div>}
          {register && <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input type="checkbox" required className="mt-1 accent-[var(--primary)]"/>I agree to contribute accurate observations and respect the privacy of people and animals recorded here.</label>}
          {error && <p role="alert" className="rounded-[8px] bg-[#f3d8d0] px-3 py-2 text-sm font-semibold text-[#8c3f2e]">{error}</p>}
          {message && <p role="status" className="flex items-start gap-2 rounded-[8px] bg-[var(--primary-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary-hover)]"><CheckCircle2 className="mt-0.5 shrink-0" size={16}/>{message}</p>}
          <Button type="submit" disabled={pending} className="mt-1 w-full">{pending ? <><LoaderCircle className="animate-spin" size={17}/>Please wait</> : <>{register ? "Create member account" : "Sign in"}<ArrowRight size={17}/></>}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--muted)]">{register ? "Already a member?" : "New to Paw Promise?"} <Link href={register ? "/login" : "/register"} className="font-bold text-[var(--primary-hover)] underline-offset-4 hover:underline">{register ? "Sign in" : "Create an account"}</Link></p>
      </div>
    </section>
    <aside className="relative hidden overflow-hidden bg-[var(--cocoa)] lg:block"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529472119196-cb724127a98e?auto=format&fit=crop&w=1600&q=85')] bg-cover bg-center opacity-60"/><div className="absolute inset-0 bg-gradient-to-t from-[var(--cocoa)] via-transparent to-transparent"/><blockquote className="absolute bottom-14 left-12 right-12 max-w-xl text-3xl font-semibold leading-tight tracking-[-.04em] text-white">“One careful update today can help the next carer make a better decision tomorrow.”</blockquote></aside>
  </main>;
}
