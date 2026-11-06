import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <AuthPanel mode="register" nextPath={params.next}/>;
}
