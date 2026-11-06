import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const initialMessage = params.message === "password-updated" ? "Your password was updated. Sign in with the new password." : params.error === "auth-callback" ? "That email link is invalid or has expired. Please try again." : undefined;
  return <AuthPanel mode="login" nextPath={params.next} initialMessage={initialMessage}/>;
}
