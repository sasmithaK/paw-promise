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
- [ ] Connect the registration form to React Hook Form and Zod
- [ ] Implement private photograph upload with progress and recovery
- [ ] Implement map selection and public-location approximation
- [ ] Create paw profile, discovery event, photos, and participants transactionally
- [ ] Replace mock directory/profile data with safe Supabase queries
- [ ] Connect moderation publish/reject/request-changes actions
- [ ] Verify the complete Member A → Moderator → Member B workflow
