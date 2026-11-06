import { describe, expect, it } from "vitest";
import { canReviewSubmission, hasPermission } from "@/lib/permissions";

describe("permissions", () => {
  it("does not let members review submissions", () => {
    expect(hasPermission(["MEMBER"], "dog:review")).toBe(false);
  });

  it("does not let moderators approve their own submission", () => {
    expect(canReviewSubmission("same-user", "same-user", ["MODERATOR"])).toBe(false);
  });

  it("reserves role management for super admins", () => {
    expect(hasPermission(["MODERATOR"], "role:manage")).toBe(false);
    expect(hasPermission(["SUPER_ADMIN"], "role:manage")).toBe(true);
  });
});
