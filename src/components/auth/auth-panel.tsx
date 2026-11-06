"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

const DEMO_EMAIL = "member@pawpromise.demo";
const DEMO_PASSWORD = "demo1234";

export function AuthPanel({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  function startDemoSession(name = "Nimali Perera") {
    window.localStorage.setItem("paw-promise-demo-session", JSON.stringify({ name, role: "MEMBER" }));
    router.push("/dashboard");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (register) {
      startDemoSession(fullName.trim() || "Demo member");
      return;
    }
    if (email.toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      startDemoSession();
      return;
    }
    setError("This preview is not connected to Supabase yet. Use the demo member credentials below.");
  }

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return <main className="grid min-h-screen lg:grid-cols-[1fr_.9fr]">
    <section className="flex flex-col bg-[var(--paper)] px-5 py-6 sm:px-10 lg:px-16">
      <Brand/>
      <div className="mx-auto my-auto w-full max-w-[430px] py-8">
        <p className="eyebrow">{register ? "Join the community" : "Welcome back"}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.05em]">{register ? "Create your account" : "Sign in to Paw Promise"}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{register ? "Every new account starts with Member access. Privileged roles are assigned separately by an administrator." : "Continue recording care and following the paws you support."}</p>

        {!register && <div className="mt-6 rounded-[12px] border border-[#e7b99f] bg-[#fff1e7] p-4">
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[var(--primary)] text-white"><FlaskConical size={17}/></span><div><p className="text-sm font-bold">Try the demo member account</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Explore the dashboard and submit a sample paw profile. Data stays in this browser preview.</p></div></div>
          <dl className="mt-3 grid grid-cols-[74px_1fr] gap-y-1 rounded-[8px] bg-white/70 p-3 text-xs"><dt className="text-[var(--muted)]">Email</dt><dd className="font-mono font-semibold">{DEMO_EMAIL}</dd><dt className="text-[var(--muted)]">Password</dt><dd className="font-mono font-semibold">{DEMO_PASSWORD}</dd></dl>
          <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={fillDemoCredentials}>Use demo credentials</Button>
        </div>}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {register && <label className="grid gap-2 text-sm font-semibold">Full name<input className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" placeholder="Your name" value={fullName} onChange={event => setFullName(event.target.value)} required/></label>}
          <label className="grid gap-2 text-sm font-semibold">Email address<input type="email" className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required/></label>
          <label className="grid gap-2 text-sm font-semibold">Password<input type="password" className="h-12 rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal" placeholder="At least 8 characters" value={password} onChange={event => setPassword(event.target.value)} required minLength={8}/></label>
          {register && <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input type="checkbox" required className="mt-1 accent-[var(--primary)]"/>I agree to contribute accurate observations and respect the privacy of people and animals recorded here.</label>}
          {error && <p role="alert" className="rounded-[8px] bg-[#f3d8d0] px-3 py-2 text-sm font-semibold text-[#8c3f2e]">{error}</p>}
          <Button type="submit" className="mt-1 w-full">{register ? "Create demo member account" : "Sign in"}<ArrowRight size={17}/></Button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--muted)]">{register ? "Already a member?" : "New to Paw Promise?"} <Link href={register ? "/login" : "/register"} className="font-bold text-[var(--primary-hover)] underline-offset-4 hover:underline">{register ? "Sign in" : "Create an account"}</Link></p>
      </div>
    </section>
    <aside className="relative hidden overflow-hidden bg-[var(--cocoa)] lg:block"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529472119196-cb724127a98e?auto=format&fit=crop&w=1600&q=85')] bg-cover bg-center opacity-60"/><div className="absolute inset-0 bg-gradient-to-t from-[var(--cocoa)] via-transparent to-transparent"/><blockquote className="absolute bottom-14 left-12 right-12 max-w-xl text-3xl font-semibold leading-tight tracking-[-.04em] text-white">“One careful update today can help the next carer make a better decision tomorrow.”</blockquote></aside>
  </main>;
}
