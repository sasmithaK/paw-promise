import { ProtectedWorkspace } from "@/components/auth/protected-workspace";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>;
}
