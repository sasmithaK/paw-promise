# Paw Promise

Frontend-first UI prototype for the Paw Promise community animal welfare platform by Leo Club of Tholangamuwa.

## Local development

```powershell
npm install --registry="https://registry.yarnpkg.com/" --include=dev --no-audit --no-fund
npm run dev
```

Open `http://localhost:3000`.

## Demo member access

The UI prototype includes browser-local demo authentication so the member workflows can be reviewed before Supabase Auth is connected.

- Email: `member@pawpromise.demo`
- Password: `demo1234`

After signing in, choose **Introduce a pup** to try the five-step paw-profile workflow. The demo stores only a lightweight session marker in browser `localStorage`; it does not send credentials or form data to a server.

## UI routes

- Public: `/`, `/dogs`, `/dogs/PP-000142`, `/about`
- Authentication: `/login`, `/register`
- Member: `/dashboard`, `/dashboard/dogs`, `/dogs/new`, `/activities`, `/follow-ups`
- Administration: `/admin`, `/admin/moderation`, `/admin/users`, `/admin/audit`

## Design system

The current visual direction uses warm ivory surfaces, terracotta-orange primary actions, apricot accents, cocoa typography, subtle borders, and restrained shadows. Components remain aligned with the field names, status models, privacy rules, and role boundaries in `docs/TECHNICAL_SPEC.md`.

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
```

The current prototype uses illustrative records and remote Unsplash photography. Supabase persistence, real authentication, RLS, storage, and server-side validation are intentionally deferred to their implementation milestones.
