import { ProtectedWorkspace } from "@/components/auth/protected-workspace";

export default function FollowUpsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>;
}
