import { describe, expect, it } from "vitest";
import { formatPawCode, getPawDisplayName } from "@/lib/dog-code";

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

describe("getPawDisplayName", () => {
  it("uses a provided name after trimming whitespace", () => {
    expect(getPawDisplayName("  Milo  ", 22)).toBe("Milo");
  });

  it("uses the permanent Paw ID when the name is unavailable", () => {
    expect(getPawDisplayName(null, 22)).toBe("PP-000022");
    expect(getPawDisplayName("   ", "PP-000051")).toBe("PP-000051");
  });
});
