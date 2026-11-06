import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-[var(--primary)] text-white border-[var(--primary)] hover:bg-[var(--primary-hover)]",
  secondary: "bg-[var(--paper)] text-[var(--primary-hover)] border-[var(--line)] hover:border-[var(--primary)] hover:bg-[#fff7f0]",
  quiet: "bg-transparent text-[var(--charcoal)] border-transparent hover:bg-white/60",
  danger: "bg-[var(--terracotta)] text-white border-[var(--terracotta)] hover:brightness-90",
};

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof styles; size?: "sm" | "md" | "lg" };

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={cn("focus-ring inline-flex items-center justify-center gap-2 rounded-[10px] border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", styles[variant], size === "sm" ? "h-9 px-3 text-sm" : size === "lg" ? "h-13 px-6" : "h-11 px-4", className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: keyof typeof styles; size?: "sm" | "md" | "lg" };

export function ButtonLink({ className, variant = "primary", size = "md", ...props }: ButtonLinkProps) {
  return <Link className={cn("focus-ring inline-flex items-center justify-center gap-2 rounded-[10px] border font-semibold transition", styles[variant], size === "sm" ? "h-9 px-3 text-sm" : size === "lg" ? "h-13 px-6" : "h-11 px-4", className)} {...props} />;
}
