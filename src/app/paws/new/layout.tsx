import { ProtectedWorkspace } from "@/components/auth/protected-workspace";

export default function NewPawLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>;
}
