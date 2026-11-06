import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDogCode(code: number) {
  return `PP-${String(code).padStart(6, "0")}`;
}
