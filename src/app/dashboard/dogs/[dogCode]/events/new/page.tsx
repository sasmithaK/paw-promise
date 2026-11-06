import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { EventForm } from "@/components/dogs/event-form";
import { getPublishedPaw } from "@/features/paws/queries";

export default async function NewEventPage({ params }: { params: Promise<{ dogCode: string }> }) {
  const { dogCode } = await params;
  const paw = await getPublishedPaw(dogCode);
  if (!paw) notFound();
  return <WorkspaceShell><EventForm dogId={paw.id} pawCode={paw.code} pawName={paw.name}/></WorkspaceShell>;
}
