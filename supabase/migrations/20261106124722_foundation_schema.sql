-- Paw Promise MVP foundation schema.
-- Apply to a development project first. Never apply directly to production.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.app_role as enum ('MEMBER', 'MODERATOR', 'SUPER_ADMIN');
create type public.account_status as enum ('ACTIVE', 'SUSPENDED', 'DISABLED');
create type public.dog_record_status as enum ('PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
create type public.dog_sex as enum ('MALE', 'FEMALE', 'UNKNOWN');
create type public.verification_status as enum ('UNVERIFIED', 'EVIDENCE_ATTACHED', 'VERIFIED', 'DISPUTED');
create type public.record_visibility as enum ('PUBLIC', 'MEMBERS', 'PRIVATE');
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
create type public.follow_up_status as enum ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
create type public.report_status as enum ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  avatar_path text,
  account_status public.account_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete restrict,
  role public.app_role not null default 'MEMBER',
  assigned_by uuid references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

create sequence public.dog_code_seq start with 1 increment by 1 no cycle;

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  dog_code bigint not null unique default nextval('public.dog_code_seq'),
  name text check (name is null or char_length(trim(name)) between 1 and 100),
  sex public.dog_sex not null default 'UNKNOWN',
  estimated_age text,
  breed text,
  colour text,
  size text check (size is null or size in ('UNKNOWN', 'SMALL', 'MEDIUM', 'LARGE')),
  distinguishing_features text,
  found_at timestamptz not null,
  found_location_label text not null check (char_length(trim(found_location_label)) between 1 and 200),
  found_location extensions.geography(Point, 4326),
  public_location extensions.geography(Point, 4326),
  location_accuracy_m integer check (location_accuracy_m is null or location_accuracy_m >= 0),
  sterilisation_status text not null default 'UNKNOWN'
    check (sterilisation_status in ('UNKNOWN', 'REPORTED', 'EVIDENCE_ATTACHED', 'VERIFIED')),
  vaccination_status text not null default 'UNKNOWN'
    check (vaccination_status in ('UNKNOWN', 'REPORTED', 'EVIDENCE_ATTACHED', 'VERIFIED')),
  record_status public.dog_record_status not null default 'PENDING',
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dog_code_positive check (dog_code > 0),
  constraint review_actor_is_not_creator check (reviewed_by is null or reviewed_by <> created_by),
  constraint review_fields_consistent check (
    (record_status = 'PENDING' and reviewed_by is null and reviewed_at is null)
    or
    (record_status <> 'PENDING' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index dogs_status_idx on public.dogs(record_status);
create index dogs_created_by_idx on public.dogs(created_by, created_at desc);
create index dogs_found_location_idx on public.dogs using gist(found_location);
create index dogs_public_location_idx on public.dogs using gist(public_location);

create table public.dog_photos (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  storage_path text not null unique,
  caption text,
  is_primary boolean not null default false,
  visibility public.record_visibility not null default 'PRIVATE',
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index one_primary_photo_per_dog on public.dog_photos(dog_id) where is_primary;
create index dog_photos_dog_idx on public.dog_photos(dog_id, created_at);

create table public.dog_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  event_type public.dog_event_type not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  occurred_at timestamptz not null,
  location_label text,
  location extensions.geography(Point, 4326),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  verification_status public.verification_status not null default 'UNVERIFIED',
  visibility public.record_visibility not null default 'PUBLIC',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dog_events_dog_date_idx on public.dog_events(dog_id, occurred_at desc);
create index dog_events_creator_idx on public.dog_events(created_by, created_at desc);
create index dog_events_location_idx on public.dog_events using gist(location);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dog_events(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete restrict,
  participant_name text,
  context text,
  created_at timestamptz not null default now(),
  constraint participant_identity_required check (
    user_id is not null or nullif(trim(participant_name), '') is not null
  )
);

create index event_participants_event_idx on public.event_participants(event_id);

create table public.event_attachments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dog_events(id) on delete restrict,
  storage_path text not null unique,
  attachment_type text,
  visibility public.record_visibility not null default 'PRIVATE',
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index event_attachments_event_idx on public.event_attachments(event_id);

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
  verification_status public.verification_status not null default 'UNVERIFIED',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index medical_records_dog_idx on public.medical_records(dog_id, created_at desc);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  related_event_id uuid references public.dog_events(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  due_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete restrict,
  status public.follow_up_status not null default 'OPEN',
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint follow_up_completion_consistent check (
    (status = 'COMPLETED' and completed_at is not null)
    or (status <> 'COMPLETED' and completed_at is null)
  )
);

create index follow_ups_due_idx on public.follow_ups(due_at, status);
create index follow_ups_assignee_idx on public.follow_ups(assigned_to, status);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs(id) on delete restrict,
  event_id uuid references public.dog_events(id) on delete restrict,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 1 and 160),
  description text,
  status public.report_status not null default 'OPEN',
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  constraint report_target_required check (dog_id is not null or event_id is not null),
  constraint report_reviewer_is_not_reporter check (reviewed_by is null or reviewed_by <> reporter_id)
);

create index reports_status_idx on public.reports(status, created_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function private.current_user_has_role(required_role public.app_role)
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

create or replace function private.current_user_is_moderator()
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

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_has_role('SUPER_ADMIN');
$$;

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.account_status = 'ACTIVE'
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Community member')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'MEMBER');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute procedure private.set_updated_at();
create trigger dogs_updated_at before update on public.dogs
for each row execute procedure private.set_updated_at();
create trigger dog_events_updated_at before update on public.dog_events
for each row execute procedure private.set_updated_at();

create or replace function private.prevent_audit_mutation()
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
for each row execute procedure private.prevent_audit_mutation();

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_user_has_role(public.app_role) to authenticated;
grant execute on function private.current_user_is_moderator() to authenticated;
grant execute on function private.current_user_is_admin() to authenticated;
grant execute on function private.current_user_is_active() to authenticated;
