"use client";

import { createContext, useContext } from "react";
import type { AuthenticatedIdentity } from "@/features/auth/authorization";

const IdentityContext = createContext<AuthenticatedIdentity | null>(null);

export function WorkspaceIdentityProvider({ identity, children }: { identity: AuthenticatedIdentity; children: React.ReactNode }) {
  return <IdentityContext.Provider value={identity}>{children}</IdentityContext.Provider>;
}

export function useWorkspaceIdentity() {
  return useContext(IdentityContext);
}
