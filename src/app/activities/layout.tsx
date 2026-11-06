import { ProtectedWorkspace } from "@/components/auth/protected-workspace";

export default function ActivitiesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>;
}
