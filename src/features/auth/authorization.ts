import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];

export type AuthenticatedIdentity = {
  id: string;
  fullName: string;
  accountStatus: AccountStatus;
  roles: AppRole[];
};

export async function getAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
    supabase.from("profiles").select("full_name, account_status").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileError || rolesError || !profile) return null;

  return {
    id: userId,
    fullName: profile.full_name,
    accountStatus: profile.account_status,
    roles: roleRows.map(({ role }) => role),
  };
}

export async function requireActiveIdentity() {
  const identity = await getAuthenticatedIdentity();
  if (!identity) redirect("/login");
  if (identity.accountStatus !== "ACTIVE") redirect("/account-unavailable");
  return identity;
}

export async function requireModeratorIdentity() {
  const identity = await requireActiveIdentity();
  if (!identity.roles.some((role) => role === "MODERATOR" || role === "SUPER_ADMIN")) {
    redirect("/dashboard?notice=moderator-access-required");
  }
  return identity;
}

export async function requireSuperAdminIdentity() {
  const identity = await requireActiveIdentity();
  if (!identity.roles.includes("SUPER_ADMIN")) {
    redirect("/admin?notice=super-admin-access-required");
  }
  return identity;
}
