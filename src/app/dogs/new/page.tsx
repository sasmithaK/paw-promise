import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { RegistrationWizard } from "@/components/dogs/registration-wizard";
export const metadata = { title: "Introduce a pup" };
export default function NewDogPage(){return <WorkspaceShell><RegistrationWizard/></WorkspaceShell>}
