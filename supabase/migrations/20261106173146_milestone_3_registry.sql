-- Milestone 3: transactional paw registration, event corrections, safe public
-- profile reads, and automatic auditing for privileged changes.

alter table public.dogs
  add column changes_requested_by uuid references public.profiles(id) on delete restrict,
  add column changes_requested_at timestamptz,
  add column changes_requested_note text;

alter table public.dogs
  add constraint changes_request_fields_consistent check (
    (changes_requested_by is null and changes_requested_at is null and changes_requested_note is null)
    or
    (changes_requested_by is not null and changes_requested_at is not null
      and nullif(trim(changes_requested_note), '') is not null)
  ),
  add constraint changes_request_actor_is_not_creator check (
    changes_requested_by is null or changes_requested_by <> created_by
  );

create index dogs_changes_requested_by_idx on public.dogs(changes_requested_by);

create table public.event_change_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dog_events(id) on delete restrict,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  change_reason text not null check (char_length(trim(change_reason)) between 1 and 500),
  old_values jsonb not null check (jsonb_typeof(old_values) = 'object'),
  new_values jsonb not null check (jsonb_typeof(new_values) = 'object'),
  created_at timestamptz not null default now()
);

create index event_change_log_event_idx
  on public.event_change_log(event_id, created_at desc);
create index event_change_log_actor_idx
  on public.event_change_log(changed_by, created_at desc);

alter table public.event_change_log enable row level security;
revoke all on public.event_change_log from anon, authenticated;
grant select on public.event_change_log to authenticated;

create policy "Moderators read event change history"
on public.event_change_log for select
to authenticated
using ((select private.current_user_is_moderator()));

create trigger event_change_log_is_append_only
before update or delete on public.event_change_log
for each row execute function private.prevent_audit_mutation();

create or replace function private.capture_event_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reason text;
begin
  if old is not distinct from new then
    return new;
  end if;

  if auth.uid() is null or not private.current_user_is_moderator() then
    raise exception 'Only an authenticated moderator can correct an event';
  end if;

  reason := nullif(current_setting('app.event_change_reason', true), '');

  insert into public.event_change_log (
    event_id,
    changed_by,
    change_reason,
    old_values,
    new_values
  ) values (
    new.id,
    auth.uid(),
    coalesce(reason, 'Moderator correction'),
    to_jsonb(old),
    to_jsonb(new)
  );

  return new;
end;
$$;

revoke all on function private.capture_event_change() from public, anon, authenticated;

create trigger capture_dog_event_changes
after update on public.dog_events
for each row execute function private.capture_event_change();

create or replace function private.audit_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_id uuid;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  row_id := coalesce(
    nullif(coalesce(new_row, old_row)->>'id', '')::uuid,
    nullif(coalesce(new_row, old_row)->>'user_id', '')::uuid
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_id,
    old_row,
    new_row
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.audit_privileged_change() from public, anon, authenticated;

create trigger audit_dog_moderation
after update on public.dogs
for each row
when (
  old.record_status is distinct from new.record_status
  or old.reviewed_by is distinct from new.reviewed_by
  or old.review_note is distinct from new.review_note
  or old.changes_requested_by is distinct from new.changes_requested_by
  or old.changes_requested_note is distinct from new.changes_requested_note
)
execute function private.audit_privileged_change();

create trigger audit_role_insert
after insert on public.user_roles
for each row execute function private.audit_privileged_change();

create trigger audit_role_delete
after delete on public.user_roles
for each row execute function private.audit_privileged_change();

create trigger audit_account_status
after update of account_status on public.profiles
for each row
when (old.account_status is distinct from new.account_status)
execute function private.audit_privileged_change();

create trigger audit_report_moderation
after update on public.reports
for each row
when (
  old.status is distinct from new.status
  or old.reviewed_by is distinct from new.reviewed_by
  or old.resolution_note is distinct from new.resolution_note
)
execute function private.audit_privileged_change();

create trigger audit_event_correction
after insert on public.event_change_log
for each row execute function private.audit_privileged_change();

create or replace view public.published_paw_profiles
with (security_invoker = true)
as
select
  d.id,
  'PP-' || lpad(d.dog_code::text, 6, '0') as paw_code,
  d.name,
  d.sex,
  d.estimated_age,
  d.breed,
  d.colour,
  d.size,
  d.distinguishing_features,
  d.found_at,
  d.found_location_label,
  d.public_location,
  d.sterilisation_status,
  d.vaccination_status,
  d.created_at,
  d.updated_at,
  primary_photo.storage_path as primary_photo_path,
  coalesce(event_summary.event_count, 0)::bigint as event_count,
  event_summary.latest_event_at
from public.dogs d
left join lateral (
  select p.storage_path
  from public.dog_photos p
  where p.dog_id = d.id
    and p.is_primary
    and p.visibility = 'PUBLIC'
  order by p.created_at
  limit 1
) primary_photo on true
left join lateral (
  select count(e.id) as event_count, max(e.occurred_at) as latest_event_at
  from public.dog_events e
  where e.dog_id = d.id
    and e.visibility = 'PUBLIC'
) event_summary on true
where d.record_status = 'PUBLISHED';

revoke all on public.published_paw_profiles from public;
grant select on public.published_paw_profiles to anon, authenticated;

create or replace function public.register_paw(
  p_primary_photo_path text,
  p_name text,
  p_sex public.dog_sex,
  p_estimated_age text,
  p_breed text,
  p_colour text,
  p_size text,
  p_distinguishing_features text,
  p_found_at timestamptz,
  p_found_location_label text,
  p_latitude double precision,
  p_longitude double precision,
  p_location_accuracy_m integer,
  p_discovery_description text,
  p_initial_observation text,
  p_vaccination_status text,
  p_sterilisation_status text,
  p_participants jsonb default '[]'::jsonb
)
returns table (dog_id uuid, paw_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_dog public.dogs%rowtype;
  discovery_event_id uuid;
  participant jsonb;
  exact_point extensions.geography;
  safe_point extensions.geography;
begin
  if actor is null or not private.current_user_is_active() then
    raise exception 'An active member session is required';
  end if;

  if p_primary_photo_path is null
    or split_part(p_primary_photo_path, '/', 1) <> actor::text
    or p_primary_photo_path like '%..%'
    or not exists (
      select 1 from storage.objects
      where bucket_id = 'dog-private-photos' and name = p_primary_photo_path
    ) then
    raise exception 'The primary photograph is missing or does not belong to this member';
  end if;

  if jsonb_typeof(coalesce(p_participants, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_participants, '[]'::jsonb)) > 20 then
    raise exception 'Participants must be an array containing no more than 20 people';
  end if;

  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Latitude and longitude must be supplied together';
  end if;

  if p_latitude is not null then
    if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
      raise exception 'Coordinates are outside the valid range';
    end if;
    exact_point := extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography;
    safe_point := extensions.st_setsrid(
      extensions.st_makepoint(round(p_longitude::numeric, 2), round(p_latitude::numeric, 2)),
      4326
    )::extensions.geography;
  end if;

  insert into public.dogs (
    name, sex, estimated_age, breed, colour, size, distinguishing_features,
    found_at, found_location_label, found_location, public_location,
    location_accuracy_m, sterilisation_status, vaccination_status, created_by
  ) values (
    nullif(trim(p_name), ''), p_sex, nullif(trim(p_estimated_age), ''),
    nullif(trim(p_breed), ''), nullif(trim(p_colour), ''), p_size,
    nullif(trim(p_distinguishing_features), ''), p_found_at,
    trim(p_found_location_label), exact_point, safe_point, p_location_accuracy_m,
    p_sterilisation_status, p_vaccination_status, actor
  ) returning * into new_dog;

  insert into public.dog_events (
    dog_id, event_type, title, description, occurred_at, location_label,
    location, details, visibility, created_by
  ) values (
    new_dog.id, 'DISCOVERY', 'Discovery recorded',
    nullif(trim(p_discovery_description), ''), p_found_at,
    trim(p_found_location_label), exact_point,
    jsonb_build_object('initial_observation', nullif(trim(p_initial_observation), '')),
    'PUBLIC', actor
  ) returning id into discovery_event_id;

  insert into public.event_participants (event_id, user_id, context)
  values (discovery_event_id, actor, 'Record contributor');

  for participant in select value from jsonb_array_elements(coalesce(p_participants, '[]'::jsonb))
  loop
    if participant->>'kind' = 'MEMBER' then
      if not exists (select 1 from public.profiles where id = (participant->>'userId')::uuid) then
        raise exception 'A selected member does not exist';
      end if;
      insert into public.event_participants (event_id, user_id, context)
      values (
        discovery_event_id,
        (participant->>'userId')::uuid,
        nullif(trim(participant->>'context'), '')
      );
    elsif participant->>'kind' = 'NON_MEMBER' and nullif(trim(participant->>'name'), '') is not null then
      insert into public.event_participants (event_id, participant_name, context)
      values (
        discovery_event_id,
        trim(participant->>'name'),
        nullif(trim(participant->>'context'), '')
      );
    else
      raise exception 'Each participant must have a valid identity';
    end if;
  end loop;

  insert into public.dog_photos (
    dog_id, storage_path, is_primary, visibility, uploaded_by
  ) values (
    new_dog.id, p_primary_photo_path, true, 'PRIVATE', actor
  );

  return query select new_dog.id, 'PP-' || lpad(new_dog.dog_code::text, 6, '0');
end;
$$;

revoke all on function public.register_paw(
  text, text, public.dog_sex, text, text, text, text, text, timestamptz, text,
  double precision, double precision, integer, text, text, text, text, jsonb
) from public, anon;
grant execute on function public.register_paw(
  text, text, public.dog_sex, text, text, text, text, text, timestamptz, text,
  double precision, double precision, integer, text, text, text, text, jsonb
) to authenticated;

create or replace function public.moderate_paw(
  p_dog_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.dogs%rowtype;
  next_status public.dog_record_status;
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_moderator() then
    raise exception 'Moderator access is required';
  end if;

  select * into target from public.dogs where id = p_dog_id for update;
  if not found then raise exception 'Paw profile not found'; end if;
  if target.created_by = actor then raise exception 'Moderators cannot review their own submissions'; end if;
  if target.record_status <> 'PENDING' then raise exception 'Only pending profiles can be reviewed'; end if;

  if p_decision = 'PUBLISH' then
    if not exists (
      select 1 from public.dog_photos
      where dog_id = p_dog_id and is_primary and visibility = 'PUBLIC'
    ) then
      raise exception 'Approve the primary photograph before publishing';
    end if;
    next_status := 'PUBLISHED';
  elsif p_decision = 'REJECT' then
    next_status := 'REJECTED';
  elsif p_decision = 'REQUEST_CHANGES' then
    if nullif(trim(p_note), '') is null then
      raise exception 'A note is required when requesting changes';
    end if;
    update public.dogs set
      changes_requested_by = actor,
      changes_requested_at = now(),
      changes_requested_note = trim(p_note)
    where id = p_dog_id;
    return 'PENDING';
  else
    raise exception 'Unsupported moderation decision';
  end if;

  update public.dogs set
    record_status = next_status,
    reviewed_by = actor,
    reviewed_at = now(),
    review_note = nullif(trim(p_note), ''),
    changes_requested_by = null,
    changes_requested_at = null,
    changes_requested_note = null
  where id = p_dog_id;

  return next_status::text;
end;
$$;

revoke all on function public.moderate_paw(uuid, text, text) from public, anon;
grant execute on function public.moderate_paw(uuid, text, text) to authenticated;
