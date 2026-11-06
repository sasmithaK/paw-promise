# Security policy

Paw Promise handles member identities, private evidence, animal locations, and
moderation records. Security reports should not be posted in public issues.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** workflow to open a
private GitHub security advisory. Include the affected route or policy, the
minimum reproduction steps, and the impact. Do not include real member data,
private photographs, access tokens, or production credentials.

## Authentication and authorisation model

- Supabase Auth establishes the user session. Server code validates trusted
  claims and reloads account status and roles from PostgreSQL.
- PostgreSQL RLS is the primary authorisation boundary. A hidden button or a
  server route check is never treated as sufficient authorisation.
- Roles are stored in `user_roles`; user-editable metadata is never used for
  role decisions.
- Suspended and disabled accounts are blocked from contribution writes in the
  database, not only in the interface.
- Evidence and precise locations remain private. Public pages use deliberately
  limited views and approved public photographs.
- Historical events are not deleted by members. Moderator corrections require
  a reason and create append-only change and audit records.

## Contributor rules

- Never commit `.env*`, secret/service-role keys, access tokens, database
  passwords, or real personal data.
- Browser code may use only the Supabase publishable key. Secret keys must not
  use a `NEXT_PUBLIC_` name.
- Every new exposed table must enable RLS and receive explicit grants and
  tested policies before application code uses it.
- Every privileged server action must revalidate the current identity. Do not
  trust a role, user ID, storage path, or structured JSON supplied by a client.
- Schema changes must be additive migrations reviewed against the technical
  specification and applied to development before production.

## Release security gate

Before a public release, run unit tests, the hosted database permission suites,
the production build, and Supabase security/health advisors. Confirm the Auth
redirect allow-list, custom SMTP, leaked-password protection, and environment
separation for development and production.
