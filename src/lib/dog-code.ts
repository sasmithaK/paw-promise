export function formatPawCode(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Paw code must be a positive safe integer.");
  }

  return `PP-${value.toString().padStart(6, "0")}`;
}

export function getPawDisplayName(name: string | null | undefined, code: string | number | null | undefined) {
  const providedName = name?.trim();
  if (providedName) return providedName;
  if (typeof code === "number" && Number.isSafeInteger(code) && code > 0) return formatPawCode(code);
  const providedCode = typeof code === "string" ? code.trim() : "";
  return providedCode || "Paw profile";
}
