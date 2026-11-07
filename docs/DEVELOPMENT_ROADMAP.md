# Paw Promise development roadmap

This file tracks implementation against `TECHNICAL_SPEC.md`. A checked UI item means the interface exists; it does not imply persistence or authorization is complete.

## Milestone 1 — Foundation

- [x] Next.js App Router and strict TypeScript
- [x] Tailwind design tokens and responsive component system
- [x] Pin dependency versions and commit the npm lockfile
- [x] Initialize the local Supabase CLI v3 workflow
- [x] Add reviewed schema, RLS, and storage migration files
- [x] Require explicit Data API grants
- [x] Add cookie-based browser/server Supabase client factories
- [x] Add server-side Zod validation foundations
- [x] Add the database type-generation command
- [x] Add Vitest and Playwright configuration
- [x] Add environment and setup documentation
- [x] Create the hosted **development** Supabase project
- [x] Apply and verify migrations in the isolated hosted development project
- [x] Generate types from the development database and replace bootstrap types
- [x] Run Supabase security, performance, and health advisors

Milestone 1 is complete. The development project is `paw-promise-dev` in Singapore; no production project or production database has been created.

## Milestone 2 — Authentication and permissions

- [x] Configure the Next.js auth proxy and validated session refresh
- [x] Replace browser-local demo authentication
- [x] Implement registration and email verification
- [x] Implement login, logout, callback, and password recovery
- [x] Protect workspace and administration routes
- [x] Implement server-side role and account-status checks
- [x] Create transactional Member A, Member B, Moderator, Super Admin, and suspended test identities
- [x] Add executable hosted-development RLS tests for profiles and roles
- [x] Document the first Super Admin bootstrap procedure

Milestone 2 is complete in code and in the hosted development database. Vercel must contain the two public Supabase environment variables, and the Supabase Auth URL allow-list must include the deployed callback URL before production-like email links are tested.

## Milestone 3 — Paw registry vertical slice

- [x] Registration, directory, and profile interfaces
- [x] Connect the registration form to React Hook Form and Zod
- [x] Implement private photograph upload with progress and recovery
- [x] Implement device location capture and public-location approximation
- [x] Add an interactive OpenStreetMap pin selector with mobile tap support
- [x] Support multiple discovery participants in the registration wizard
- [x] Create paw profile, discovery event, photos, and participants transactionally
- [x] Allow contributors to correct their own pending profiles and resubmit requested changes
- [x] Replace mock directory/profile and workspace data with safe Supabase queries
- [x] Connect moderation publish/reject/request-changes actions
- [x] Add the append-only event correction log and automatic privileged-action auditing
- [x] Protect user administration with a server-side Super Admin check
- [x] Verify the complete Member A → Moderator → Member B workflow

Milestone 3 is complete in code and in the hosted development database. The
transactional test harness verifies pending-record isolation, independent
moderation, safe public projection, feeding-event creation, event correction,
and audit logging. The development database intentionally contains no sample
paw records; the first record should be created through the application.

## Milestone 4 — Event history

- [x] Add type-specific forms and Zod schemas for feeding, sightings, health observations, veterinary visits, vaccinations, sterilisation, rescues, and general updates
- [x] Create events, participants, and private attachment metadata transactionally
- [x] Validate evidence MIME type, size, ownership, and storage path
- [x] Keep participant identities and attachment metadata restricted by RLS
- [x] Build the chronological public timeline without exposing private evidence or contributor identities
- [x] Build an authenticated history that includes every event the current role is authorised to read
- [x] Add authenticated event reporting
- [x] Add moderator-only corrections with required reasons and append-only change history
- [x] Enforce event-specific payload validation for direct Data API callers
- [x] Test anonymous, member, suspended-member, moderator, RLS, report-integrity, and audit behavior

Milestone 4 is complete in code and in the hosted development database. Event
evidence stays in the private `event-evidence` bucket. Application validation
is backed by database validation so direct API clients cannot claim a clinical
diagnosis, submit malformed structured details, bypass account suspension, or
attach evidence belonging to another account.

## Milestone 5 — Follow-ups and moderation

- [x] Remove record-specific UI exclusions and make directory tests data-independent
- [x] Add per-member pending-profile and daily registration quotas
- [x] Add a daily community-report quota
- [x] Create and assign follow-ups through a validated transactional RPC
- [x] Build due and overdue views with status transitions and completion timestamps
- [x] Keep direct Data API follow-up assignments under restrictive RLS
- [x] Complete the publish, reject, and request-changes moderation queue
- [x] Make publication retry-safe and commit photo visibility plus profile status atomically
- [x] Require actionable notes for rejection and change requests
- [x] Return inline moderation outcomes instead of routing expected failures to the global error page
- [x] Return inline outcomes for follow-up, report, account-status, and role mutations
- [x] Add conservative duplicate-candidate suggestions without automatic merging
- [x] Add the moderator community-report queue and resolution workflow
- [x] Add Super Admin account suspension, disabling, and reactivation
- [x] Add Super Admin role grant and revocation with self-protection
- [x] Require reasons and audit role, account-status, report, and follow-up changes
- [x] Add audited, recoverable paw archival for Moderators and Super Admins
- [x] Cancel open follow-ups and retry public-photo cleanup during archival
- [x] Add Super Admin-only restoration to independent pending review
- [x] Keep Super Admin archival and restoration independent of secondary approval
- [x] Add an archived-record administration view and hosted permission test
- [x] Add a hosted transactional Milestone 5 permission test
- [x] Regenerate database TypeScript types from the hosted development schema

Milestone 5 is complete in code and in the hosted development database. The
follow-up, report, and account-management RPCs independently verify the current
session and role. Registration and report quotas are also enforced by RLS so a
direct Data API caller cannot bypass the application actions. Moderation keeps
the private source photograph, copies the approved image idempotently, and then
commits photo visibility and profile publication in one audited transaction.
Paw removal is implemented as archival rather than physical deletion so
permanent IDs and append-only histories remain intact. Public photo cleanup is
tracked independently and must finish before a Super Admin can restore a record.

### Verification snapshot — 2026-11-07

- TypeScript, ESLint, unit tests, and the production build pass.
- Hosted auth, registry, event-history, and Milestone 5 transaction suites pass and roll back their fixtures.
- The auth proxy refreshes cookies on public and protected routes; public navigation reflects the current member session and links back to the workspace.
- Desktop/mobile Playwright smoke tests are data-independent and pass against
  the Vercel testing deployment using an installed browser channel.
- Supabase security advisors report only the hosted Auth setting for leaked
  password protection; enable it in the dashboard before a public launch.
