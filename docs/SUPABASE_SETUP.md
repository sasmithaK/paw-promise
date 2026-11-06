# Supabase development setup

## Environment separation

- Use a dedicated hosted project named for development, such as `paw-promise-dev`.
- Do not link this checkout to production while implementing Milestones 1–5.
- Production must have separate URLs, keys, Auth settings, Storage objects, and data.
- Never put a secret or service-role key in a `NEXT_PUBLIC_*` variable.
- Use a publishable key for browser and ordinary SSR operations so RLS remains active.

## Local workflow

Requirements:

- Node.js 22 or a currently supported later release
- Docker Desktop
- npm (selected because npmjs.org access is blocked in this environment; installs use the Yarn registry mirror)

```powershell
npm install --registry="https://registry.yarnpkg.com/" --include=dev --no-audit --no-fund
Copy-Item .env.example .env.local
npm run supabase:start
```

Use the local URL and publishable key printed by the CLI in `.env.local`. The local stack applies migrations in timestamp order and then reads `supabase/seed.sql`.

Generate types only after the migrations apply successfully:

```powershell
npm run db:types
```

## Migration review gate

Before applying a migration to any hosted project:

1. Review the SQL diff, especially RLS policies, grants, functions, triggers, and Storage policies.
2. Apply it to local Postgres or a disposable development branch first.
3. Test anonymous, Member A, Member B, Moderator, Super Admin, and suspended-member access.
4. Confirm exact coordinates, private participants, evidence, and medical documents are inaccessible through public queries.
5. Run Supabase security and performance advisors.
6. Generate and commit updated database types.
7. Obtain explicit approval before applying to production.

Never run a database reset, branch reset, destructive migration, or production migration without explicit approval.

## Hosted development project

The connected development project is `paw-promise-dev` (`maebkvbpsxhisgsrysoj`) in Singapore (`ap-southeast-1`) under `Leo-Paw-Promise`. It was quoted at $0/month when created. No production project has been created.

For future hosted changes:

1. Inspect its existing schema and migration history before changing it.
2. Retrieve its URL and active publishable key.
3. Apply the reviewed migrations to development only.
4. Run advisors and RLS tests.
5. Link the application only after the checks pass.

## Current security decisions

- New public tables are not automatically exposed by the local Data API configuration.
- Data API privileges are granted explicitly in the RLS migration.
- Exact discovery/event coordinates and moderation notes are excluded from public-safe views and client column grants.
- Role and account-status helpers live in the unexposed `private` schema.
- Security-definer helpers have public execution revoked.
- Members cannot choose a role, publish their own submission, verify clinical data, or mutate historical events.
- Pending photographs, event evidence, medical documents, and avatars use private buckets.

## Authentication and Vercel

Set these variables in Vercel for Preview and Production, using values from the **development** Supabase project while this deployment remains a development environment:

```text
NEXT_PUBLIC_SUPABASE_URL=https://maebkvbpsxhisgsrysoj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<development publishable key>
```

Do not add a secret or service-role key. After changing environment variables, redeploy so the Next.js build receives them.

In Supabase **Authentication → URL Configuration**, set the Site URL to the canonical deployment and add both callback URLs to the redirect allow-list:

```text
https://paw-promise-one.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

If Vercel preview deployments need email authentication, add only the narrow preview URL pattern required by the team. Keep production on a separate Supabase project with its own URL list and keys.

The auth proxy validates cookie JWTs with `getClaims()`. Server layouts then read the caller's RLS-filtered profile and roles, reject suspended/disabled accounts, and require Moderator or Super Admin for `/admin`.

Supabase's built-in SMTP service is development-only and sends only to email addresses that belong to the Supabase organisation team. Use a team email for the first hosted test. Configure a custom SMTP provider before opening registration to the public; do not disable email confirmation as a workaround.

## First Super Admin bootstrap

This is a one-time development-project procedure. It cannot be called from the Data API or by `anon`, `authenticated`, or `service_role` clients.

1. Register and verify the intended administrator through the application.
2. Find the user UUID in **Authentication → Users**.
3. Review `supabase/migrations/20261106130919_auth_permission_bootstrap.sql`.
4. In the Supabase SQL editor, run the following with the real UUID:

```sql
select private.bootstrap_first_super_admin('00000000-0000-0000-0000-000000000000'::uuid);
```

5. Confirm `SUPER_ADMIN` exists in `public.user_roles` and `BOOTSTRAP_SUPER_ADMIN` exists in `public.audit_logs`.

The function refuses to run after the first Super Admin exists. Every later role change must use the audited administration workflow.

## Permission test

`supabase/tests/database/auth_permissions.sql` creates five identities inside a transaction, exercises signup triggers and RLS as authenticated callers, then rolls everything back. Run it only against local or hosted development—not production. It checks:

- every signup receives a profile and `MEMBER` role;
- Member A cannot read or update Member B's profile;
- a member cannot grant themselves `SUPER_ADMIN`;
- moderators can read the profiles and roles required for moderation;
- a suspended account cannot create a paw profile.
