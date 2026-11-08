import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, PawPrint, Plus, ShieldAlert } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireActiveIdentity } from "@/features/auth/authorization";
import { getPawDisplayName } from "@/lib/dog-code";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
const label = (value: string) =>
  value.toLowerCase().replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());

export const metadata = { title: "Member dashboard" };

export default async function DashboardPage() {
  const identity = await requireActiveIdentity();
  const supabase = await createClient();
  const isStaff = identity.roles.some((r) => r === "SUPER_ADMIN" || r === "MODERATOR");

  const [pawsResult, followUpsResult, updatesResult, recentResult, pendingResult] =
    await Promise.all([
      supabase.from("dogs").select("id", { count: "exact", head: true }).eq("created_by", identity.id),
      supabase
        .from("follow_ups")
        .select("id,title,due_at,status,dogs(name,dog_code)")
        .in("status", ["OPEN", "IN_PROGRESS"])
        .order("due_at")
        .limit(3),
      supabase
        .from("dog_events")
        .select("id", { count: "exact", head: true })
        .eq("created_by", identity.id),
      supabase
        .from("dog_events")
        .select("id,title,event_type,occurred_at,dogs(name,dog_code)")
        .order("occurred_at", { ascending: false })
        .limit(4),
      isStaff
        ? supabase.from("dogs").select("id", { count: "exact", head: true }).eq("record_status", "PENDING")
        : Promise.resolve({ count: 0, error: null }),
    ]);

  if (pawsResult.error || followUpsResult.error || updatesResult.error || recentResult.error) {
    throw new Error("The dashboard could not be loaded.");
  }

  const followUps = followUpsResult.data ?? [];
  const recent = recentResult.data ?? [];
  const overdue = followUps.filter((item) => item.due_at && new Date(item.due_at) < new Date()).length;
  const pendingCount = pendingResult?.count ?? 0;

  return (
    <WorkspaceShell>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Community workspace</p>
          <h1 className="page-title mt-2">Welcome back, {identity.fullName}.</h1>
          <p className="mt-2 text-[var(--muted)]">
            Here is the live record of your contributions and follow-up work.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isStaff && (
            <ButtonLink href="/admin/moderation" variant="secondary">
              Review queue
            </ButtonLink>
          )}
          <ButtonLink href="/paws/new">
            <Plus size={17} />
            Introduce a pup
          </ButtonLink>
        </div>
      </div>

      {isStaff && pendingCount > 0 && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-[12px] border border-[#e4b79f] bg-[#fff2e9] p-4 text-sm text-[var(--cocoa)]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="shrink-0 text-[var(--primary)]" size={20} />
            <p>
              <strong>{pendingCount} paw {pendingCount === 1 ? "profile is" : "profiles are"}</strong> awaiting independent moderation review before public listing.
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="flex shrink-0 items-center gap-1 font-bold text-[var(--primary-hover)] hover:underline"
          >
            Review queue <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-5">
        <Metric
          icon={<PawPrint size={20} />}
          title="Paws introduced"
          detail="Profiles created by you"
          value={pawsResult.count ?? 0}
        />
        <Metric
          icon={<CalendarClock size={20} />}
          title="Follow-ups due"
          detail={overdue ? `${overdue} overdue` : "None overdue"}
          value={followUps.length}
        />
        <Metric
          icon={<CheckCircle2 size={20} />}
          title="Care updates"
          detail="Your total contributions"
          value={updatesResult.count ?? 0}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
            <div>
              <h2 className="text-xl font-bold">Recent community activity</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Published updates and events you contributed
              </p>
            </div>
            <Link href="/activities" className="text-sm font-bold text-[var(--primary-hover)]">
              View all
            </Link>
          </div>
          {recent.length ? (
            <div className="divide-y divide-[var(--line)]">
              {recent.map((item) => {
                const pawName = getPawDisplayName(item.dogs?.name, item.dogs?.dog_code);
                return <div key={item.id} className="flex min-w-0 items-center gap-3 p-4 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-bold text-white">
                    {pawName[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{pawName}</p>
                    <p className="truncate text-sm text-[var(--muted)]">{item.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge tone="neutral">{label(item.event_type)}</StatusBadge>
                    <p className="mt-1 hidden text-xs text-[var(--muted)] sm:block">
                      {formatDate(item.occurred_at)}
                    </p>
                  </div>
                </div>;
              })}
            </div>
          ) : (
            <p className="p-6 text-sm text-[var(--muted)]">No visible care activity yet.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-bold">Next follow-ups</h2>
          {followUps.length ? (
            <div className="mt-4 space-y-3">
              {followUps.map((item) => (
                <Link
                  key={item.id}
                  href="/follow-ups"
                  className="block rounded-[12px] border border-[var(--line)] p-4 hover:border-[var(--primary)]"
                >
                  <div className="flex justify-between gap-3">
                    <p className="font-bold">{item.title}</p>
                    <StatusBadge
                      tone={
                        item.due_at && new Date(item.due_at) < new Date() ? "red" : "amber"
                      }
                    >
                      {item.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.due_at ? formatDate(item.due_at) : "No due date"} ·{" "}
                    {getPawDisplayName(item.dogs?.name, item.dogs?.dog_code)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">
              No open follow-ups are assigned or visible to you.
            </p>
          )}
          <ButtonLink href="/follow-ups" variant="secondary" className="mt-4 w-full">
            Manage follow-ups <ArrowRight size={16} />
          </ButtonLink>
        </section>
      </div>
    </WorkspaceShell>
  );
}

function Metric({
  icon,
  title,
  detail,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  value: number;
}) {
  return (
    <article className="card flex items-center gap-4 p-4 sm:block sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </span>
      <div className="flex flex-1 items-baseline justify-between sm:mt-4">
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
        </div>
        <span className="text-3xl font-bold tracking-[-.05em]">{value}</span>
      </div>
    </article>
  );
}
