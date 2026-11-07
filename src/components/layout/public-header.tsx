"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { ButtonLink } from "../ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/paws", label: "Meet the pups" },
  { href: "/about", label: "About" },
  { href: "/about#how-it-works", label: "How it works" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--line)]/75 bg-[var(--ivory)]/85 backdrop-blur-md transition-all">
        <div className="container-shell flex h-[70px] items-center justify-between gap-4 sm:h-[76px]">
          <Brand />

          {/* Desktop Center Navigation Pill */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-[var(--line)]/80 bg-[var(--paper)]/80 px-2 py-1 shadow-xs backdrop-blur-sm md:flex"
            aria-label="Main navigation"
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href) && !link.href.includes("#"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "focus-ring rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--primary-soft)]/70 font-semibold text-[var(--cocoa)] shadow-2xs"
                      : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--cocoa)]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="focus-ring rounded-full px-3.5 py-1.5 text-sm font-semibold text-[var(--cocoa)] transition-colors hover:text-[var(--primary)]"
            >
              Sign in
            </Link>
            <ButtonLink
              href="/register"
              size="sm"
              className="rounded-full px-4 shadow-xs transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
            >
              Join the community
            </ButtonLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="focus-ring flex size-10 items-center justify-center rounded-xl border border-[var(--line)]/80 bg-[var(--paper)] text-[var(--cocoa)] shadow-2xs transition-colors hover:bg-[var(--primary-soft)]/40 md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {open && (
        <div className="fixed inset-0 top-[70px] z-40 md:hidden sm:top-[76px]">
          <div
            className="fixed inset-0 top-[70px] bg-black/20 backdrop-blur-xs transition-opacity sm:top-[76px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative mx-3.5 mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xl backdrop-blur-xl">
            <nav className="grid gap-1.5" aria-label="Mobile navigation">
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href) && !link.href.includes("#"));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors",
                      isActive
                        ? "bg-[var(--primary-soft)]/70 text-[var(--cocoa)]"
                        : "text-[var(--charcoal)] hover:bg-[#fff0e5]",
                    )}
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={16} className="text-[var(--muted)]" />
                  </Link>
                );
              })}

              <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-[var(--line)] pt-3.5">
                <ButtonLink
                  href="/login"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </ButtonLink>
                <ButtonLink
                  href="/register"
                  className="rounded-xl shadow-xs"
                  onClick={() => setOpen(false)}
                >
                  Join us
                </ButtonLink>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
