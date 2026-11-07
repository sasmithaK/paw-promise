import { Flag } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireModeratorIdentity } from "@/features/auth/authorization";
import { resolveReportAction } from "@/features/milestone-five/actions";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function ReportsPage() {
  await requireModeratorIdentity();
  const supabase = await createClient();
  const { data: reports, error } = await supabase.from("reports").select("id,reason,description,status,resolution_note,created_at,reporter_id,dogs(name,dog_code),dog_events(title),profiles!reports_reporter_id_fkey(full_name)").order("created_at", { ascending: false });
  if (error) throw new Error(`Unable to load community reports: ${error.message}`);

  return <WorkspaceShell admin>
    <div><p className="eyebrow">Community safety</p><h1 className="page-title mt-3">Reports</h1><p className="mt-3 text-[var(--muted)]">Review concerns independently, record a clear decision, and preserve the audit trail.</p></div>
    {reports.length ? <div className="mt-7 grid gap-5">{reports.map((report) => <article key={report.id} className="card grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={report.status === "RESOLVED" ? "sage" : report.status === "DISMISSED" ? "neutral" : "red"}>{report.status.replaceAll("_", " ")}</StatusBadge><span className="text-xs text-[var(--muted)]">{formatDate(report.created_at)}</span></div><h2 className="mt-3 text-xl font-bold">{report.reason}</h2>{report.description && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{report.description}</p>}<dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-xs text-[var(--muted)]">Paw</dt><dd className="font-semibold">{report.dogs ? `PP-${String(report.dogs.dog_code).padStart(6, "0")} · ${report.dogs.name || "Unnamed pup"}` : "General"}</dd></div><div><dt className="text-xs text-[var(--muted)]">Event</dt><dd className="font-semibold">{report.dog_events?.title || "Profile-level report"}</dd></div><div><dt className="text-xs text-[var(--muted)]">Reporter</dt><dd className="font-semibold">{report.profiles?.full_name || "Community member"}</dd></div></dl>{report.resolution_note && <p className="mt-4 rounded-[10px] bg-[var(--primary-soft)] p-3 text-sm"><strong>Resolution:</strong> {report.resolution_note}</p>}</div>
      {["OPEN", "UNDER_REVIEW"].includes(report.status) ? <ActionFeedbackForm action={resolveReportAction} submitLabel="Save decision" pendingLabel="Saving…" className="grid gap-3 rounded-[12px] bg-[#fff8f2] p-4"><input type="hidden" name="reportId" value={report.id}/><label className="grid gap-1.5 text-sm font-bold">Decision<select name="status" defaultValue="UNDER_REVIEW" className="h-10 rounded-[9px] border border-[var(--line)] bg-white px-3 font-normal"><option value="UNDER_REVIEW">Under review</option><option value="RESOLVED">Resolved</option><option value="DISMISSED">Dismissed</option></select></label><label className="grid gap-1.5 text-sm font-bold">Review note<textarea name="resolutionNote" required maxLength={2000} className="min-h-24 rounded-[9px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Record what was checked and why this decision is appropriate."/></label></ActionFeedbackForm> : <div className="grid place-items-center rounded-[12px] bg-[var(--primary-soft)] p-5 text-center text-sm text-[var(--primary-hover)]"><Flag/><p className="mt-2 font-bold">Review completed</p></div>}
    </article>)}</div> : <div className="card mt-7 p-10 text-center"><Flag className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No community reports</h2><p className="mt-2 text-sm text-[var(--muted)]">New concerns submitted from paw histories will appear here.</p></div>}
  </WorkspaceShell>;
}
