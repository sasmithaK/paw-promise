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
  ) returning id, dog_code into new_dog_id, new_dog_code;

  insert into public.dog_events (
    dog_id, event_type, title, description, occurred_at, location_label,
    location, details, visibility, created_by
  ) values (
    new_dog_id, 'DISCOVERY', 'Discovery recorded',
    nullif(trim(p_discovery_description), ''), p_found_at,
    trim(p_found_location_label), exact_point,
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

revoke all on function public.register_paw(
  text, text, public.dog_sex, text, text, text, text, text, timestamptz, text,
  double precision, double precision, integer, text, text, text, text, jsonb
) from public, anon;
grant execute on function public.register_paw(
  text, text, public.dog_sex, text, text, text, text, text, timestamptz, text,
  double precision, double precision, integer, text, text, text, text, jsonb
) to authenticated;
