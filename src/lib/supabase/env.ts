import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(20),
});

export function getPublicSupabaseEnv() {
  const parsed = publicSupabaseEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add the development project URL and publishable key.",
    );
  }

  return parsed.data;
}
