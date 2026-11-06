# Paw Promise

Paw Promise is a community animal welfare platform by Leo Club of Tholangamuwa. The repository now contains the responsive UI prototype and the reviewed local Supabase foundation for the MVP.

## Local development

```powershell
npm install --registry="https://registry.yarnpkg.com/" --include=dev --no-audit --no-fund
npm run dev
```

Open `http://localhost:3000`.

## Supabase development foundation

The repository contains local Supabase configuration, versioned schema/RLS/storage migrations, cookie-based SSR client factories, server validation, and test scaffolding. The reviewed migrations are applied only to the isolated `paw-promise-dev` hosted project; no production project exists.

1. Install Docker Desktop before using the local Supabase stack.
2. Copy `.env.example` to `.env.local`.
3. Start the isolated local stack with `npm run supabase:start`.
4. Copy the local API URL and publishable key printed by the CLI into `.env.local`.
5. Generate database types with `npm run db:types` after migrations succeed.

Read [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) before linking or changing a hosted project. Development and production projects must remain separate, and migrations require review before application.

## Member access

Authentication is connected to the hosted development Supabase project. Register with an email address, verify the confirmation email, and then choose **Introduce a pup** from the protected member workspace. Every account receives the `MEMBER` role from a trusted database trigger; registration never accepts a role.

For deployed authentication, add the development project URL and publishable key to Vercel and allow the deployed `/auth/callback` URL in Supabase. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## UI routes

- Public: `/`, `/dogs`, `/dogs/PP-000142`, `/about`
- Authentication: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Member: `/dashboard`, `/dashboard/dogs`, `/dogs/new`, `/activities`, `/follow-ups`
- Administration: `/admin`, `/admin/moderation`, `/admin/users`, `/admin/audit`

## Design system

The current visual direction uses warm ivory surfaces, terracotta-orange primary actions, apricot accents, cocoa typography, subtle borders, and restrained shadows. Components remain aligned with the field names, status models, privacy rules, and role boundaries in `docs/TECHNICAL_SPEC.md`.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The current registry and dashboard still use illustrative records and remote Unsplash photography. Milestone 3 connects the paw registry vertical slice to Supabase persistence and private photo storage.
