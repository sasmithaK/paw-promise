export function formatPawCode(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Paw code must be a positive safe integer.");
  }

  return `PP-${value.toString().padStart(6, "0")}`;
}
