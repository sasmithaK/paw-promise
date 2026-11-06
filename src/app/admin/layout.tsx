import { ProtectedWorkspace } from "@/components/auth/protected-workspace";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedWorkspace moderator>{children}</ProtectedWorkspace>;
}
