# Paw Promise --- Technical Specification & Development Blueprint

**Project:** Paw Promise by Leo Club of Tholangamuwa\
**Version:** 1.0 --- MVP blueprint\
**Architecture:** Next.js + Supabase (PostgreSQL, Auth, Storage)\
**Product model:** Public dog registry + open community contributions +
governed administration

------------------------------------------------------------------------

## 1. Product scope

### MVP outcomes

1.  Anyone can register an account and become a `MEMBER`.
2.  Members can register dogs, upload photographs, record discovery
    details, and identify other people present.
3.  Members can add sightings, feeding records, health observations,
    veterinary visits, vaccinations, sterilisation records, and general
    updates.
4.  Every contribution is attributable to an account and timestamped.
5.  Dog profiles have permanent public identifiers (`PP-000001`).
6.  New dog profiles enter a moderation queue before public publication.
7.  Public visitors can browse published dog profiles without an
    account.
8.  Moderators can review submissions and reports.
9.  Super Admins can manage users, roles, records, settings, and audit
    history.
10. The platform works on mobile browsers and can be installed as a PWA.

### Explicitly out of scope for MVP

-   Donations and payment processing
-   Native iOS/Android applications
-   AI image matching or automatic dog identification
-   Public direct messaging
-   Advanced research analytics
-   Complex volunteer scheduling
-   Multi-organisation tenancy

### Product rules

-   A dog record belongs to the project, not to the member who created
    it.
-   Dog IDs are permanent and never reused.
-   Event history is append-oriented. Corrections must be auditable.
-   Unknown is a valid value; users must not guess.
-   Observations are not veterinary diagnoses.
-   Public visibility is separate from verification status.
-   Approximate public location and precise restricted location are
    separate.
-   Other people present are attached to a particular event, not
    permanently to a dog.
-   A member cannot grant themselves roles or approve their own dog
    profile.
-   Never expose private contact information, exact sensitive locations,
    or clinical attachments through public queries.

------------------------------------------------------------------------

## 2. Architecture

### Recommended stack

  -----------------------------------------------------------------------
  Layer                               Choice
  ----------------------------------- -----------------------------------
  Framework                           Next.js App Router, TypeScript

  Runtime                             Node.js LTS

  UI                                  Tailwind CSS + shadcn/ui

  Forms                               React Hook Form + Zod

  Database                            Supabase PostgreSQL

  Geospatial                          PostGIS

  Authentication                      Supabase Auth

  Authorization                       PostgreSQL Row Level Security (RLS)

  Files                               Supabase Storage

  Maps                                Leaflet + OpenStreetMap-compatible
                                      tile provider

  Testing                             Vitest + Playwright

  Package manager                     pnpm

  Hosting                             Cloudflare Workers with OpenNext,
                                      or another compatible Next.js host

  Source control                      GitHub
  -----------------------------------------------------------------------

**Hosting note:** validate the chosen Next.js hosting adapter against
the exact Next.js version and features used. If Cloudflare compatibility
creates friction, use a free-tier host that supports the required
Next.js runtime. Do not design around a free quota as a permanent
guarantee.

### Request flow

``` text
Browser
  |
  v
Next.js App Router
  |-- Public Server Components
  |-- Authenticated workspace
  |-- Admin workspace
  |-- Route Handlers / Server Actions
  |
  v
Supabase SSR client (user session)
  |
  v
PostgreSQL + RLS ---- Supabase Storage
  |
  +---- PostGIS location queries
```

Use the authenticated Supabase client for ordinary user operations so
RLS remains active. The Supabase service-role key bypasses RLS and must
only be used in tightly controlled server-side administrative code, if
needed at all. Never put it in a `NEXT_PUBLIC_` variable or browser
bundle.

### Repository layout

``` text
paw-promise/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── dogs/page.tsx
│   │   │   ├── dogs/[dogCode]/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── auth/callback/route.ts
│   │   ├── (workspace)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── dogs/new/page.tsx
│   │   │   ├── dogs/[id]/page.tsx
│   │   │   ├── dogs/[id]/events/new/page.tsx
│   │   │   ├── activities/page.tsx
│   │   │   ├── follow-ups/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── (admin)/
│   │       └── admin/
│   │           ├── page.tsx
│   │           ├── users/page.tsx
│   │           ├── moderation/page.tsx
│   │           ├── reports/page.tsx
│   │           └── audit/page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dogs/
│   │   ├── maps/
│   │   ├── timeline/
│   │   ├── forms/
│   │   └── layout/
│   ├── features/
│   │   ├── auth/
│   │   ├── dogs/
│   │   ├── events/
│   │   ├── participants/
│   │   ├── medical/
│   │   ├── follow-ups/
│   │   ├── moderation/
│   │   └── users/
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── permissions.ts
│   │   ├── validation/
│   │   └── utils/
│   └── types/database.ts
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── .env.example
├── README.md
└── package.json
```

Keep feature-specific validation and data-access functions in
`features/`. Avoid placing business rules in page components.

------------------------------------------------------------------------

## 3. Roles and authorization

### Roles

  -----------------------------------------------------------------------
  Role                                Description
  ----------------------------------- -----------------------------------
  `MEMBER`                            Default role assigned to every
                                      registered user

  `MODERATOR`                         Reviews profiles, reports, and
                                      sensitive submissions

  `SUPER_ADMIN`                       Manages users, roles, platform
                                      settings, moderation, and audit
                                      records
  -----------------------------------------------------------------------

A future `VERIFIED_CARE_PROVIDER` role should only be added after the
organisation has a real credential-verification process. Do not allow
public self-selection of privileged roles.

### Permission matrix

  Action                          Public   Member   Moderator   Super Admin
  ----------------------------- -------- -------- ----------- -------------
  Browse published dogs              Yes      Yes         Yes           Yes
  Register account                   ---      ---         ---           ---
  Create dog profile                  No      Yes         Yes           Yes
  Add event to published dog          No      Yes         Yes           Yes
  Edit own pending submission         No      Yes         Yes           Yes
  Review/publish dog                  No       No         Yes           Yes
  Manage other users                  No       No     Limited           Yes
  Assign/revoke roles                 No       No          No           Yes
  Suspend accounts                    No       No     Limited           Yes
  Read audit logs                     No       No     Limited           Yes
  Change platform settings            No       No          No           Yes

### Important authorization rules

-   Every new account receives `MEMBER` from a trusted database trigger.
-   Public registration must never accept a role field.
-   A member cannot approve their own submission.
-   A member can edit their own pending dog profile; after publication,
    changes to sensitive fields should create a reviewable change
    request or be moderated.
-   A member may add events to a published dog, but cannot alter or
    delete another person's historical event.
-   Only moderators and Super Admins can change moderation state.
-   Only Super Admins can change roles.
-   Admin actions must be recorded in `audit_logs`.
-   Enforce permissions in PostgreSQL RLS and server-side application
    logic. Hiding UI controls is not authorization.

------------------------------------------------------------------------

## 4. Data model

### Entity overview

``` text
auth.users
    |
    +--- profiles
           |
           +--- user_roles --- roles

dogs
  |--- dog_photos
  |--- dog_events
          |--- event_participants
          |--- event_attachments
          |--- medical_records
          |--- event_change_log

dogs
  |--- follow_ups
  |--- reports

audit_logs
```

### Design choices

-   `dogs.id`: internal UUID.
-   `dogs.dog_code`: database-generated sequence used for the public ID.
-   Display ID: `PP-` + six-digit zero-padded code.
-   `dogs.found_location`: restricted PostGIS point.
-   `dogs.public_location`: optional approximate PostGIS point. Do not
    expose exact coordinates by default.
-   `dog_events`: chronological event history.
-   `event_participants`: people present at a particular event; supports
    both platform members and non-account participants.
-   `medical_records`: separate clinical information so public event
    queries cannot accidentally expose it.
-   `audit_logs`: append-only records of privileged and sensitive
    changes.
-   Use `timestamptz` for stored timestamps; display in the user's local
    timezone.
-   Use explicit enums or CHECK constraints for statuses and event
    types.
-   Use `ON DELETE RESTRICT` for core history relationships. Prefer
    archive/withdrawal workflows over cascading deletion.

------------------------------------------------------------------------

## 5. Supabase migration SQL

The following is a baseline migration for the MVP. Apply it in a
development Supabase project first, inspect the generated schema, and
test the RLS rules with separate member, moderator, and admin accounts
before production.

### Migration 001 --- extensions, types, and helpers

``` sql
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.app_role as enum (
  'MEMBER', 'MODERATOR', 'SUPER_ADMIN'
);

create type public.account_status as enum (
  'ACTIVE', 'SUSPENDED', 'DISABLED'
);

create type public.dog_record_status as enum (
  'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'
);

create type public.dog_sex as enum (
  'MALE', 'FEMALE', 'UNKNOWN'
);

create type public.verification_status as enum (
  'UNVERIFIED', 'EVIDENCE_ATTACHED', 'VERIFIED', 'DISPUTED'
);

create type public.record_visibility as enum (
  'PUBLIC', 'MEMBERS', 'PRIVATE'
);

create type public.dog_event_type as enum (
  'DISCOVERY',
  'SIGHTING',
  'FEEDING',
  'HEALTH_OBSERVATION',
  'VETERINARY_VISIT',
  'VACCINATION',
  'STERILISATION',
  'RESCUE',
  'STATUS_CHANGE',
  'GENERAL_UPDATE'
);

create type public.follow_up_status as enum (
  'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

create type public.report_status as enum (
  'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
);

create or replace function public.current_user_has_role(
  required_role public.app_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = required_role
  );
$$;

create or replace function public.current_user_is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('MODERATOR', 'SUPER_ADMIN')
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_has_role('SUPER_ADMIN');
$$;
```

### Migration 002 --- profiles and roles

``` sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  avatar_path text,
  account_status public.account_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.app_role not null default 'MEMBER',
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      'Community member'
    )
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'MEMBER');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### Migration 003 --- dogs and photos

``` sql
create sequence public.dog_code_seq start 1;

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  dog_code bigint not null unique
    default nextval('public.dog_code_seq'),

  name text,
  sex public.dog_sex not null default 'UNKNOWN',
  estimated_age text,
  breed text,
  colour text,
  size text,
  distinguishing_features text,

  found_at timestamptz not null,
  found_location_label text not null,
  found_location geography(Point, 4326),
  public_location geography(Point, 4326),
  location_accuracy_m integer
    check (location_accuracy_m is null or location_accuracy_m >= 0),

  sterilisation_status text not null default 'UNKNOWN',
  vaccination_status text not null default 'UNKNOWN',

  record_status public.dog_record_status not null default 'PENDING',
  created_by uuid not null references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dog_code_positive check (dog_code > 0)
);

create index dogs_status_idx on public.dogs(record_status);
create index dogs_found_location_idx
  on public.dogs using gist(found_location);
create index dogs_public_location_idx
  on public.dogs using gist(public_location);

create table public.dog_photos (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  storage_path text not null unique,
  caption text,
  is_primary boolean not null default false,
  visibility public.record_visibility not null default 'PUBLIC',
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index one_primary_photo_per_dog
  on public.dog_photos(dog_id)
  where is_primary = true;
```

### Migration 004 --- events, participants, and attachments

``` sql
create table public.dog_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,

  event_type public.dog_event_type not null,
  title text not null,
  description text,

  occurred_at timestamptz not null,
  location_label text,
  location geography(Point, 4326),

  details jsonb not null default '{}'::jsonb,

  verification_status public.verification_status
    not null default 'UNVERIFIED',
  visibility public.record_visibility
    not null default 'PUBLIC',

  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index dog_events_dog_date_idx
  on public.dog_events(dog_id, occurred_at desc);

create index dog_events_location_idx
  on public.dog_events using gist(location);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dog_events(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete restrict,
  participant_name text,
  context text,
  created_at timestamptz not null default now(),

  constraint participant_identity_required
    check (user_id is not null or nullif(trim(participant_name), '') is not null)
);

create table public.event_attachments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dog_events(id) on delete restrict,
  storage_path text not null unique,
  attachment_type text,
  visibility public.record_visibility not null default 'MEMBERS',
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
```

### Migration 005 --- medical records, follow-ups, reports, audit

``` sql
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  event_id uuid references public.dog_events(id) on delete restrict,

  provider_name text,
  provider_type text,
  assessment text,
  treatment text,
  medication text,
  administered_at timestamptz,
  next_due_at timestamptz,

  verification_status public.verification_status
    not null default 'UNVERIFIED',

  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  related_event_id uuid references public.dog_events(id) on delete restrict,
  title text not null,
  description text,
  due_at timestamptz,
  assigned_to uuid references public.profiles(id),
  status public.follow_up_status not null default 'OPEN',
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index follow_ups_due_idx
  on public.follow_ups(due_at, status);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs(id) on delete restrict,
  event_id uuid references public.dog_events(id) on delete restrict,
  reporter_id uuid not null references public.profiles(id),
  reason text not null,
  description text,
  status public.report_status not null default 'OPEN',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs(entity_type, entity_id, created_at desc);
```

### Migration 006 --- updated timestamps and audit protection

``` sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger dogs_updated_at
before update on public.dogs
for each row execute procedure public.set_updated_at();

create trigger events_updated_at
before update on public.dog_events
for each row execute procedure public.set_updated_at();

-- Audit log is append-only for application roles.
create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit records cannot be modified or deleted';
end;
$$;

create trigger audit_no_update
before update or delete on public.audit_logs
for each row execute procedure public.prevent_audit_mutation();
```

For a production audit system, add database triggers for sensitive dog,
role, moderation, and medical-record changes. Capture old and new
values, actor ID, and reason. Restrict direct table writes so clients
cannot forge audit records.

------------------------------------------------------------------------

## 6. RLS policy baseline

Enable RLS on every exposed table.

``` sql
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.dogs enable row level security;
alter table public.dog_photos enable row level security;
alter table public.dog_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_attachments enable row level security;
alter table public.medical_records enable row level security;
alter table public.follow_ups enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
```

### Profiles

``` sql
create policy "Members can read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or
       (select public.current_user_is_moderator()));

create policy "Members can update own basic profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and account_status = 'ACTIVE'
);
```

For production, use a restricted profile-update function or column-level
grants so members cannot modify `account_status` or privileged fields.
Do not rely on the example policy alone for that distinction.

### Roles

``` sql
create policy "Users can read their own roles"
on public.user_roles for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

create policy "Only super admins manage roles"
on public.user_roles for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));
```

### Dogs

``` sql
create policy "Public can read published dogs"
on public.dogs for select
to anon, authenticated
using (record_status = 'PUBLISHED');

create policy "Members can read their pending dogs"
on public.dogs for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select public.current_user_is_moderator())
);

create policy "Members can submit dogs"
on public.dogs for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
);

create policy "Members can edit their pending dogs"
on public.dogs for update
to authenticated
using (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
)
with check (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
);

create policy "Moderators can review dogs"
on public.dogs for update
to authenticated
using ((select public.current_user_is_moderator()))
with check ((select public.current_user_is_moderator()));
```

### Events

``` sql
create policy "Read public events for published dogs"
on public.dog_events for select
to anon, authenticated
using (
  visibility = 'PUBLIC'
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Members read their own events"
on public.dog_events for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select public.current_user_is_moderator())
);

create policy "Members add events to published dogs"
on public.dog_events for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Moderators can update events"
on public.dog_events for update
to authenticated
using ((select public.current_user_is_moderator()))
with check ((select public.current_user_is_moderator()));
```

Do not create a member `DELETE` policy for historical events. Use an
amendment/correction workflow.

### Remaining tables

For `dog_photos`, `event_participants`, `event_attachments`,
`medical_records`, `follow_ups`, `reports`, and `audit_logs`, write
explicit policies before enabling the production app.

Minimum rules:

-   Photos: public can read only public photos belonging to published
    dogs; uploader can manage their pending uploads; moderators can
    review.
-   Participants: only event contributors and moderators can read
    non-public participant information. Public pages should not reveal
    private names or contact information.
-   Attachments: default private; public access only for explicitly
    approved, safe attachments.
-   Medical records: authenticated members may submit observations or
    records, but only moderators/approved providers can verify clinical
    information. Public access should be limited to explicitly approved
    summaries.
-   Follow-ups: visible to the assignee, creator and moderators; never
    publicly expose private operational notes.
-   Reports: reporter can create and read their own reports; moderators
    can review all.
-   Audit logs: only authorised moderators/admins can read; no client
    insert/update/delete.
-   Suspended users: block contribution writes through a database-backed
    account-status check, not just the frontend.

**Security gate:** the SQL above is a policy baseline, not a complete
production security release. Do not deploy until every table has tested
policies, field-level restrictions, storage policies, and
role-escalation tests.

------------------------------------------------------------------------

## 7. Storage buckets and policies

Create these buckets:

  -------------------------------------------------------------------------
  Bucket                                      Public? Contents
  ---------------------- ---------------------------- ---------------------
  `dog-public-photos`              Public, only after Approved dog images
                                           moderation 

  `dog-private-photos`                             No Pending or restricted
                                                      images

  `event-evidence`                                 No Receipts and
                                                      supporting evidence

  `medical-documents`                              No Clinical documents
                                                      and sensitive records

  `user-avatars`                             Optional Profile images
  -------------------------------------------------------------------------

Use random object names, validate MIME type and file size, and avoid
trusting filename extensions. Do not store private documents in a public
bucket.

A practical upload workflow:

1.  Client requests an upload for an authenticated user.
2.  Server validates the user's permission and requested record.
3.  Upload goes to a private bucket or pending path.
4.  Database row records uploader and object path.
5.  Moderator approves public visibility if applicable.
6.  Approved public images are exposed through the public bucket or
    controlled signed URL.

------------------------------------------------------------------------

## 8. Location model

Use two location values for a dog:

-   `found_location`: exact or volunteer-provided coordinate, restricted
    to authorised users.
-   `public_location`: deliberately approximate coordinate used for
    public display.

The registration map should support:

-   Browser GPS permission ("Use my location")
-   Manual map pin placement
-   Searchable locality label
-   Accuracy estimate, if available
-   Manual entry when GPS is unavailable

Never assume browser GPS is accurate or available. Let users adjust the
pin and describe the locality.

Use PostGIS geography points with longitude and latitude in the correct
order:

``` sql
-- Longitude first, latitude second
ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
```

For public maps, do not expose exact sensitive coordinates. Apply an
intentional approximation in the server layer and avoid returning the
original point in API payloads.

OpenStreetMap data is open, but its standard public tile service has a
usage policy. For production traffic, choose a compliant tile provider
or self-host tiles if the project eventually has the resources.

------------------------------------------------------------------------

## 9. Dog registration workflow

### Step 1 --- Identification

-   Primary photograph (required)
-   Name (optional)
-   Sex
-   Estimated age
-   Breed/type
-   Colour
-   Size
-   Distinguishing features
-   Additional photos

### Step 2 --- Discovery

-   Date/time first found
-   Approximate locality (required)
-   Map pin (optional if not known)
-   Location accuracy (if available)
-   Discovery description
-   Initial observations

### Step 3 --- People present

Allow multiple entries:

-   Existing Paw Promise member selected by account
-   Non-member name
-   Context (local resident, volunteer, friend, etc.)

Do not require phone numbers or other personal information. Obtain
appropriate permission before publishing a person's name or photograph.

### Step 4 --- Initial condition

-   General observed condition
-   Visible injuries or concerns
-   Mobility observation
-   Coat/skin observation
-   Sterilisation status: unknown by default
-   Vaccination status: unknown by default
-   Notes

### Step 5 --- Review

-   Create dog as `PENDING`
-   Generate permanent dog code
-   Create `DISCOVERY` event
-   Attach photos and participants
-   Show submission confirmation
-   Moderator reviews and publishes, rejects, or requests changes

Dog creation and initial discovery event creation should happen in one
database transaction through a server-side function/RPC. Do not create a
dog without its discovery event if the operation partially fails.

------------------------------------------------------------------------

## 10. Event trail workflow

Every event contains:

-   Dog ID
-   Event type
-   Title and description
-   Date/time it happened (`occurred_at`)
-   Date/time submitted (`created_at`)
-   Contributor
-   Optional location
-   Participants
-   Attachments
-   Verification status
-   Visibility

### Event-specific structured details

Use JSONB only for optional event-specific fields. Examples:

**Feeding**

``` json
{
  "food_type": "dry_food",
  "quantity": 250,
  "quantity_unit": "g",
  "water_provided": true
}
```

**Health observation**

``` json
{
  "observed_signs": ["visible_wound"],
  "body_area": "left_front_leg",
  "professional_diagnosis": false
}
```

**Veterinary visit**

``` json
{
  "provider_name": "Example Veterinary Clinic",
  "visit_outcome": "follow_up_recommended",
  "next_due_at": "2026-11-12T10:00:00+05:30"
}
```

These are examples only. Validate each event type with its own Zod
schema before insertion. Do not accept arbitrary JSON from the browser.

------------------------------------------------------------------------

## 11. Route and page contracts

### Public routes

  Route                   Purpose                   Access
  ----------------------- ------------------------- --------
  `GET /`                 Project landing page      Public
  `GET /dogs`             Published dog directory   Public
  `GET /dogs/[dogCode]`   Public dog profile        Public
  `GET /about`            Project information       Public

### Authentication routes

  Route                Purpose
  -------------------- ----------------------
  `/register`          Create account
  `/login`             Sign in
  `/auth/callback`     Verify auth callback
  `/forgot-password`   Password recovery

### Workspace routes

  Route                     Purpose
  ------------------------- ---------------------------------
  `/dashboard`              Member overview
  `/dogs/new`               Register a dog
  `/dogs/[id]`              Full authenticated dog record
  `/dogs/[id]/events/new`   Add event
  `/activities`             My/recent activities
  `/follow-ups`             Assigned and created follow-ups
  `/profile`                Account settings

### Admin routes

  Route                 Purpose
  --------------------- ----------------------------------
  `/admin`              Administration overview
  `/admin/users`        User management
  `/admin/moderation`   Pending profiles and submissions
  `/admin/reports`      Community reports
  `/admin/audit`        Audit history

### Route Handler contracts

Prefer Server Actions for internal form mutations and Route Handlers for
external integrations or well-defined HTTP endpoints.

  -----------------------------------------------------------------------------------------
  Method            Endpoint                        Request               Result
  ----------------- ------------------------------- --------------------- -----------------
  POST              `/api/dogs`                     Dog registration      Created pending
                                                    payload               dog

  GET               `/api/dogs`                     Search/filter params  Published
                                                                          directory

  GET               `/api/dogs/[id]`                Dog ID                Authorised dog
                                                                          detail

  POST              `/api/dogs/[id]/events`         Event payload         Created event

  GET               `/api/dogs/[id]/events`         Pagination params     Timeline

  POST              `/api/dogs/[id]/photos`         Upload metadata       Upload
                                                                          authorization

  POST              `/api/reports`                  Report payload        Created report

  POST              `/api/admin/dogs/[id]/review`   Decision + note       Moderation result

  PATCH             `/api/admin/users/[id]/role`    Role                  Updated role

  PATCH             `/api/follow-ups/[id]`          Status/assignee/due   Updated follow-up
                                                    date                  
  -----------------------------------------------------------------------------------------

### Example dog creation payload

``` json
{
  "name": "Milo",
  "sex": "UNKNOWN",
  "estimatedAge": "ADULT",
  "breed": null,
  "colour": "Brown and white",
  "size": "MEDIUM",
  "distinguishingFeatures": "White chest",
  "foundAt": "2026-11-06T08:30:00+05:30",
  "foundLocationLabel": "Approximate locality, Tholangamuwa",
  "coordinates": {
    "latitude": 7.0,
    "longitude": 80.0,
    "accuracyMeters": 100
  },
  "initialObservation": "Observed near the local road.",
  "participants": [
    {
      "kind": "MEMBER",
      "userId": "00000000-0000-0000-0000-000000000000",
      "context": "Volunteer"
    },
    {
      "kind": "NON_MEMBER",
      "name": "Example participant",
      "context": "Local resident"
    }
  ]
}
```

The coordinates and names above are illustrative placeholders, not real
location data.

### Standard API response

Success:

``` json
{
  "data": {},
  "error": null
}
```

Failure:

``` json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information."
  }
}
```

Never return database stack traces, private coordinates, storage
secrets, or internal moderation notes to clients.

------------------------------------------------------------------------

## 12. Validation and business rules

Use Zod schemas for:

-   Dog registration
-   Dog updates
-   Event creation by event type
-   Participant creation
-   Follow-up creation and updates
-   Reports
-   Moderation actions
-   Role changes

Important validations:

1.  Dog ID is generated only by the database.
2.  `found_at` cannot be silently substituted with account creation
    time.
3.  Coordinates must be within valid latitude/longitude ranges.
4.  Participant must reference either an account or a non-empty name.
5.  A member cannot set `record_status = PUBLISHED`.
6.  A member cannot set `verification_status = VERIFIED`.
7.  A member cannot change their own role.
8.  Medical documents must remain private by default.
9.  Event date and submission date are separate.
10. Dog records with existing events cannot be physically deleted
    through normal UI.
11. A possible duplicate should prompt a review rather than silently
    merge records.
12. Suspended accounts cannot create new contributions.

------------------------------------------------------------------------

## 13. Visual design direction

Use the supplied reference images as visual inspiration, not as a
template to copy.

### Public website

-   Warm off-white background
-   Deep forest-green primary colour
-   Real dog photography
-   Editorial typography
-   Large but restrained headlines
-   Consistent image ratios
-   Minimal navigation
-   No excessive gradients, glassmorphism, floating cards, or decorative
    dashboard clutter

Suggested initial palette:

  Token           Value
  --------------- -----------
  Background      `#F7F5F0`
  Surface         `#FFFFFF`
  Primary         `#244C3A`
  Primary hover   `#193B2C`
  Text            `#20231F`
  Muted text      `#777A73`
  Border          `#E6E4DD`
  Accent          `#D9EBDD`
  Warning         `#B85B43`

### Workspace

-   Clear left navigation on desktop
-   Compact mobile navigation
-   One primary action per screen
-   Useful empty states
-   Search and filters close to the data they control
-   No unnecessary statistics
-   Fast dog registration and care logging

### Registration UX

Use a stepper:

1.  Identification
2.  Discovery and location
3.  People present
4.  Initial condition
5.  Review and submit

Preserve form state between steps. Allow unknown values. Make image
upload and map interaction work well on mobile.

------------------------------------------------------------------------

## 14. Testing plan

### Unit tests

-   Dog code formatting
-   Zod validation
-   Role/permission helper functions
-   Event-specific payload validation
-   Public location approximation
-   Follow-up state transitions

### Integration tests

Use separate test accounts for:

-   Anonymous visitor
-   Member A
-   Member B
-   Moderator
-   Super Admin
-   Suspended member

Verify:

-   Member A cannot edit Member B's pending profile.
-   A member cannot publish their own dog.
-   A member cannot assign themselves a role.
-   A member cannot read private medical documents.
-   Anonymous visitors cannot read pending dog profiles.
-   Anonymous visitors cannot read exact coordinates.
-   A member cannot alter another member's historical event.
-   Moderators can review submissions but cannot grant Super Admin.
-   Super Admin actions are auditable.
-   Suspended members cannot create contributions.

### End-to-end tests

1.  Register account and verify email.
2.  Log in.
3.  Register a dog with photograph and discovery location.
4.  Add two participants, including one non-member.
5.  Submit profile.
6.  Log in as moderator and publish it.
7.  Open public dog profile.
8.  Log in as another member and add a feeding event.
9.  Confirm the event appears in the timeline.
10. Create and complete a follow-up.

Do not launch until the authorization tests pass.

------------------------------------------------------------------------

## 15. GitHub project issues

Create these milestones in the repository.

### Milestone 1 --- Foundation

-   [ ] Initialize Next.js App Router + TypeScript + pnpm.
-   [ ] Configure Tailwind and shadcn/ui.
-   [ ] Establish design tokens and typography.
-   [ ] Create Supabase development project.
-   [ ] Configure local Supabase CLI workflow.
-   [ ] Add database migrations and seed data.
-   [ ] Configure generated database TypeScript types.
-   [ ] Add `.env.example` and setup documentation.

### Milestone 2 --- Authentication and permissions

-   [ ] Configure Supabase SSR authentication.
-   [ ] Implement registration and email verification.
-   [ ] Implement login/logout/password recovery.
-   [ ] Create profile on signup.
-   [ ] Assign default MEMBER role in database.
-   [ ] Implement protected workspace routes.
-   [ ] Implement server-side permission helpers.
-   [ ] Add RLS tests for roles and profiles.
-   [ ] Implement first Super Admin bootstrap procedure.

### Milestone 3 --- Dog registry

-   [ ] Implement dog ID generation.
-   [ ] Build multi-step dog registration form.
-   [ ] Add photograph upload.
-   [ ] Add identification fields.
-   [ ] Add discovery date and locality.
-   [ ] Add map pin selection.
-   [ ] Add discovery participants.
-   [ ] Create dog and discovery event transactionally.
-   [ ] Implement pending profile view.
-   [ ] Implement dog directory and search.
-   [ ] Implement individual dog profile.

### Milestone 4 --- Event history

-   [ ] Create event creation form.
-   [ ] Implement feeding event.
-   [ ] Implement sighting event.
-   [ ] Implement health observation event.
-   [ ] Implement veterinary event.
-   [ ] Implement vaccination and sterilisation events.
-   [ ] Add event participants.
-   [ ] Add event attachments.
-   [ ] Build chronological timeline.
-   [ ] Add correction/report workflow.
-   [ ] Test event-history permissions.

### Milestone 5 --- Follow-ups and moderation

-   [ ] Create follow-up workflow.
-   [ ] Assign follow-ups to members.
-   [ ] Build due/overdue views.
-   [ ] Create moderation queue.
-   [ ] Implement publish/reject/request-changes actions.
-   [ ] Add community reporting.
-   [ ] Add duplicate candidate review.
-   [ ] Implement user suspension.
-   [ ] Implement role management.

### Milestone 6 --- Administration and public launch

-   [ ] Build admin overview.
-   [ ] Build user management.
-   [ ] Build audit log viewer.
-   [ ] Build public-safe dog profiles.
-   [ ] Build project landing page.
-   [ ] Build public impact overview.
-   [ ] Configure storage policies.
-   [ ] Configure production RLS.
-   [ ] Configure PWA manifest and icons.
-   [ ] Run accessibility and mobile tests.
-   [ ] Run security test suite.
-   [ ] Register first 20+ dogs.

------------------------------------------------------------------------

## 16. Development conventions

-   TypeScript strict mode.
-   No `any` unless justified.
-   Use generated Supabase database types.
-   Validate all user input on the server.
-   Prefer Server Components for read-heavy pages.
-   Use Client Components only for interactive UI.
-   Use Server Actions for internal mutations.
-   Use database transactions for multi-table operations.
-   Keep migrations version-controlled.
-   Never edit production database schema manually.
-   No secrets committed to Git.
-   Use separate development and production Supabase projects.
-   Add README instructions so the next club team can take over.
-   Use meaningful commits and small pull requests.
-   Require review for changes to RLS, roles, and migrations.

------------------------------------------------------------------------

## 17. Launch acceptance criteria

The MVP is ready for a controlled community launch when:

-   [ ] A new person can register and log in.
-   [ ] New accounts receive MEMBER permissions only.
-   [ ] A member can register a dog with the required identification and
    discovery details.
-   [ ] The dog receives a permanent public ID.
-   [ ] The initial discovery event is created automatically.
-   [ ] Multiple people can be recorded as present.
-   [ ] Dog photographs can be uploaded securely.
-   [ ] A moderator can approve the profile.
-   [ ] The approved dog appears in the public directory.
-   [ ] Another member can add a care event.
-   [ ] The complete timeline is visible to authorised users.
-   [ ] Private coordinates and medical documents are protected.
-   [ ] A Super Admin can manage accounts and roles.
-   [ ] Important changes are auditable.
-   [ ] The application is usable on a mobile browser.
-   [ ] Backup, recovery, and ownership handover procedures are
    documented.

------------------------------------------------------------------------

## 18. Recommended first development sprint

Do not implement the entire blueprint in one pass.

Build this vertical slice first:

1.  Create the Next.js repository.
2.  Connect Supabase.
3.  Apply migrations for profiles, roles, dogs, events, and
    participants.
4.  Implement signup/login and default MEMBER role.
5.  Implement the dog registration wizard.
6.  Generate a permanent dog ID.
7.  Create the initial DISCOVERY event and participant records in one
    transaction.
8.  Show the newly submitted dog in the member workspace.
9.  Test the flow with two members and one moderator.

**Sprint completion test:** Member A registers a dog, includes two other
people present, uploads photographs, and submits it. A moderator reviews
and publishes it. Member B can then open the dog and add a feeding event
without changing the original discovery record.

That is the first complete, useful Paw Promise workflow. Build outward
from there.
