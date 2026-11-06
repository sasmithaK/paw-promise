import { describe, expect, it } from "vitest";
import { formatPawCode } from "@/lib/dog-code";

describe("formatPawCode", () => {
  it("formats the permanent public identifier", () => {
    expect(formatPawCode(1)).toBe("PP-000001");
    expect(formatPawCode(143)).toBe("PP-000143");
  });

  it("rejects invalid identifiers", () => {
    expect(() => formatPawCode(0)).toThrow();
    expect(() => formatPawCode(1.5)).toThrow();
  });
});
