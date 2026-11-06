import type { Enums } from "@/types/database";

type AppRole = Enums<"app_role">;

export type Permission =
  | "dog:create"
  | "dog:review"
  | "event:create"
  | "report:review"
  | "user:manage"
  | "role:manage"
  | "audit:read";

const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  MEMBER: new Set(["dog:create", "event:create"]),
  MODERATOR: new Set(["dog:create", "dog:review", "event:create", "report:review", "audit:read"]),
  SUPER_ADMIN: new Set(["dog:create", "dog:review", "event:create", "report:review", "user:manage", "role:manage", "audit:read"]),
};

export function hasPermission(roles: readonly AppRole[], permission: Permission) {
  return roles.some((role) => rolePermissions[role].has(permission));
}

export function canReviewSubmission(reviewerId: string, creatorId: string, roles: readonly AppRole[]) {
  return reviewerId !== creatorId && hasPermission(roles, "dog:review");
}
