-- Exact location history for active authenticated members.
-- Anonymous clients retain access only to the existing safe columns/views.

alter table public.dog_events
  add column location_accuracy_m integer
  constraint dog_events_location_accuracy_nonnegative
  check (location_accuracy_m is null or location_accuracy_m >= 0);

grant select (location, location_accuracy_m) on public.dog_events to authenticated;
grant insert (location_accuracy_m) on public.dog_events to authenticated;
grant update (location_accuracy_m) on public.dog_events to authenticated;

drop policy "Authenticated reads authorised dogs" on public.dogs;
create policy "Authenticated reads authorised dogs"
on public.dogs for select
to authenticated
using (
  (select private.current_user_is_active())
  and (
    record_status = 'PUBLISHED'
    or created_by = (select auth.uid())
    or (select private.current_user_is_moderator())
  )
);

drop policy "Authenticated reads authorised events" on public.dog_events;
create policy "Authenticated reads authorised events"
on public.dog_events for select
to authenticated
using (
  (select private.current_user_is_active())
  and (
    (
      visibility = 'PUBLIC'
      and exists (
        select 1 from public.dogs d
        where d.id = dog_events.dog_id
          and d.record_status = 'PUBLISHED'
      )
    )
    or created_by = (select auth.uid())
    or (select private.current_user_is_moderator())
  )
);

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
security invoker
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_dog_id uuid;
  new_dog_code bigint;
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

  if p_latitude is null or p_longitude is null then
    raise exception 'An exact discovery location is required';
  end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'Coordinates are outside the valid range';
  end if;
  if p_location_accuracy_m is not null and p_location_accuracy_m < 0 then
    raise exception 'Location accuracy cannot be negative';
  end if;

  exact_point := extensions.st_setsrid(
    extensions.st_makepoint(p_longitude, p_latitude), 4326
  )::extensions.geography;
  safe_point := extensions.st_setsrid(
    extensions.st_makepoint(round(p_longitude::numeric, 2), round(p_latitude::numeric, 2)),
    4326
  )::extensions.geography;

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
  ) returning id, dog_code into new_dog_id, new_dog_code;

  insert into public.dog_events (
    dog_id, event_type, title, description, occurred_at, location_label,
    location, location_accuracy_m, details, visibility, created_by
  ) values (
    new_dog_id, 'DISCOVERY', 'Discovery recorded',
    nullif(trim(p_discovery_description), ''), p_found_at,
    trim(p_found_location_label), exact_point, p_location_accuracy_m,
    jsonb_build_object('initial_observation', nullif(trim(p_initial_observation), '')),
    'PUBLIC', actor
  ) returning id into discovery_event_id;

  insert into public.event_participants (event_id, user_id, context)
  values (discovery_event_id, actor, 'Record contributor');

  for participant in select value from jsonb_array_elements(coalesce(p_participants, '[]'::jsonb))
  loop
    if participant->>'kind' = 'MEMBER' and nullif(participant->>'userId', '') is not null then
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
    new_dog_id, p_primary_photo_path, true, 'PRIVATE', actor
  );

  return query select new_dog_id, 'PP-' || lpad(new_dog_code::text, 6, '0');
end;
$$;

drop function public.create_paw_event(
  uuid, public.dog_event_type, text, text, timestamptz, text,
  public.record_visibility, jsonb, jsonb, jsonb
);

create function public.create_paw_event(
  p_dog_id uuid,
  p_event_type public.dog_event_type,
  p_title text,
  p_description text,
  p_occurred_at timestamptz,
  p_location_label text,
  p_visibility public.record_visibility,
  p_latitude double precision,
  p_longitude double precision,
  p_location_accuracy_m integer,
  p_details jsonb default '{}'::jsonb,
  p_participants jsonb default '[]'::jsonb,
  p_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_event_id uuid;
  participant jsonb;
  attachment jsonb;
  attachment_path text;
  event_point extensions.geography;
begin
  if actor is null or not private.current_user_is_active() then
    raise exception 'An active member session is required';
  end if;

  if p_event_type in ('DISCOVERY', 'STATUS_CHANGE') then
    raise exception 'This event type is reserved for system or moderation workflows';
  end if;
  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 160 then
    raise exception 'The event title must contain between 1 and 160 characters';
  end if;
  if p_occurred_at > now() + interval '5 minutes' then
    raise exception 'The event time cannot be in the future';
  end if;
  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Latitude and longitude must be supplied together';
  end if;
  if p_latitude is not null then
    if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
      raise exception 'Coordinates are outside the valid range';
    end if;
    event_point := extensions.st_setsrid(
      extensions.st_makepoint(p_longitude, p_latitude), 4326
    )::extensions.geography;
  end if;
  if p_location_accuracy_m is not null and p_location_accuracy_m < 0 then
    raise exception 'Location accuracy cannot be negative';
  end if;
  if event_point is null and p_location_accuracy_m is not null then
    raise exception 'Location accuracy requires a map point';
  end if;
  if jsonb_typeof(coalesce(p_details, '{}'::jsonb)) <> 'object' then
    raise exception 'Event details must be an object';
  end if;
  if jsonb_typeof(coalesce(p_participants, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_participants, '[]'::jsonb)) > 20 then
    raise exception 'Participants must be an array containing no more than 20 people';
  end if;
  if jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) > 5 then
    raise exception 'Attachments must be an array containing no more than 5 files';
  end if;
  if not exists (
    select 1 from public.dogs
    where id = p_dog_id and record_status = 'PUBLISHED'
  ) then
    raise exception 'Care updates can only be added to published paw profiles';
  end if;

  insert into public.dog_events (
    dog_id, event_type, title, description, occurred_at, location_label,
    location, location_accuracy_m, details, verification_status, visibility, created_by
  ) values (
    p_dog_id, p_event_type, trim(p_title), nullif(trim(p_description), ''),
    p_occurred_at, nullif(trim(p_location_label), ''), event_point,
    p_location_accuracy_m, coalesce(p_details, '{}'::jsonb),
    case when jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) > 0
      then 'EVIDENCE_ATTACHED'::public.verification_status
      else 'UNVERIFIED'::public.verification_status
    end,
    p_visibility, actor
  ) returning id into new_event_id;

  insert into public.event_participants (event_id, user_id, context)
  values (new_event_id, actor, 'Record contributor');

  for participant in select value from jsonb_array_elements(coalesce(p_participants, '[]'::jsonb))
  loop
    if nullif(trim(participant->>'name'), '') is null then
      raise exception 'Each additional participant needs a name';
    end if;
    insert into public.event_participants (event_id, participant_name, context)
    values (
      new_event_id,
      left(trim(participant->>'name'), 120),
      nullif(left(trim(participant->>'context'), 160), '')
    );
  end loop;

  for attachment in select value from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb))
  loop
    attachment_path := attachment->>'storagePath';
    if attachment_path is null
      or split_part(attachment_path, '/', 1) <> actor::text
      or attachment_path like '%..%'
      or not exists (
        select 1 from storage.objects
        where bucket_id = 'event-evidence'
          and name = attachment_path
          and owner_id = actor::text
      ) then
      raise exception 'An evidence file is missing or does not belong to this member';
    end if;
    insert into public.event_attachments (
      event_id, storage_path, attachment_type, visibility, uploaded_by
    ) values (
      new_event_id,
      attachment_path,
      nullif(left(trim(attachment->>'attachmentType'), 100), ''),
      'PRIVATE',
      actor
    );
  end loop;

  return new_event_id;
end;
$$;

revoke all on function public.create_paw_event(
  uuid, public.dog_event_type, text, text, timestamptz, text,
  public.record_visibility, double precision, double precision, integer,
  jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.create_paw_event(
  uuid, public.dog_event_type, text, text, timestamptz, text,
  public.record_visibility, double precision, double precision, integer,
  jsonb, jsonb, jsonb
) to authenticated;

create function public.get_paw_location_points(p_dog_id uuid)
returns table (
  event_id uuid,
  event_type public.dog_event_type,
  title text,
  occurred_at timestamptz,
  location_label text,
  latitude double precision,
  longitude double precision,
  accuracy_m integer
)
language sql
security invoker
set search_path = ''
as $$
  select
    e.id,
    e.event_type,
    e.title,
    e.occurred_at,
    e.location_label,
    extensions.st_y(e.location::extensions.geometry),
    extensions.st_x(e.location::extensions.geometry),
    e.location_accuracy_m
  from public.dog_events e
  where e.dog_id = p_dog_id
    and e.location is not null
  order by e.occurred_at asc, e.created_at asc;
$$;

revoke all on function public.get_paw_location_points(uuid) from public, anon;
grant execute on function public.get_paw_location_points(uuid) to authenticated;
