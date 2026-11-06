"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { ButtonLink } from "../ui/button";

const links = [{ href: "/dogs", label: "Meet the pups" }, { href: "/about", label: "About" }, { href: "/about#how-it-works", label: "How it works" }];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="relative z-40 border-b border-[var(--line)] bg-[var(--ivory)]/95">
    <div className="container-shell flex h-[72px] items-center justify-between gap-4 sm:h-20">
      <Brand />
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} className="focus-ring rounded text-sm font-semibold text-[var(--muted)] hover:text-[var(--forest)]">{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-2 md:flex"><ButtonLink href="/login" variant="quiet" size="sm">Sign in</ButtonLink><ButtonLink href="/register" size="sm">Join the community</ButtonLink></div>
      <button className="focus-ring rounded-md p-2 md:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
    {open && <div className="absolute inset-x-0 top-full border-b border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_16px_35px_rgba(87,53,34,.12)] md:hidden"><nav className="container-shell grid gap-1" aria-label="Mobile navigation">{links.map(link => <Link key={link.href} href={link.href} onClick={()=>setOpen(false)} className="rounded-[10px] px-3 py-3 text-base font-bold hover:bg-[#fff0e5]">{link.label}</Link>)}<div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-4"><ButtonLink href="/login" variant="secondary" onClick={()=>setOpen(false)}>Sign in</ButtonLink><ButtonLink href="/register" onClick={()=>setOpen(false)}>Join us</ButtonLink></div></nav></div>}
  </header>;
}
