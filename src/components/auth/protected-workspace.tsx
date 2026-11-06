import { WorkspaceIdentityProvider } from "@/components/auth/workspace-identity";
import { requireActiveIdentity, requireModeratorIdentity } from "@/features/auth/authorization";

export async function ProtectedWorkspace({ children, moderator = false }: { children: React.ReactNode; moderator?: boolean }) {
  const identity = moderator ? await requireModeratorIdentity() : await requireActiveIdentity();
  return <WorkspaceIdentityProvider identity={identity}>{children}</WorkspaceIdentityProvider>;
}
