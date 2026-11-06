import { cn } from "@/lib/utils";

export function StatusBadge({ children, tone = "sage" }: { children: React.ReactNode; tone?: "sage" | "amber" | "red" | "neutral" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tone === "sage" && "bg-[#f6ddce] text-[#9d4529]", tone === "amber" && "bg-[#f6e7cb] text-[#805915]", tone === "red" && "bg-[#f3d8d0] text-[#8c3f2e]", tone === "neutral" && "bg-[#eee8e1] text-[#625a53]")}>{children}</span>;
}
