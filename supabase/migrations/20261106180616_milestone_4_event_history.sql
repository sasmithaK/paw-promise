-- Milestone 4: authenticated event creation, participant and evidence metadata,
-- moderator corrections, and member reporting.

create policy "Owners remove unattached event evidence"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-evidence'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
  and not exists (
    select 1
    from public.event_attachments attachment
    where attachment.storage_path = name
  )
);

create or replace function public.create_paw_event(
  p_dog_id uuid,
  p_event_type public.dog_event_type,
  p_title text,
  p_description text,
  p_occurred_at timestamptz,
  p_location_label text,
  p_visibility public.record_visibility,
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
    details, verification_status, visibility, created_by
  ) values (
    p_dog_id, p_event_type, trim(p_title), nullif(trim(p_description), ''),
    p_occurred_at, nullif(trim(p_location_label), ''), coalesce(p_details, '{}'::jsonb),
    case when jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) > 0
      then 'EVIDENCE_ATTACHED'::public.verification_status
      else 'UNVERIFIED'::public.verification_status
    end,
    p_visibility, actor
  ) returning id into new_event_id;

  insert into public.event_participants (event_id, user_id, context)
  values (new_event_id, actor, 'Record contributor');

  for participant in
    select value from jsonb_array_elements(coalesce(p_participants, '[]'::jsonb))
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

  for attachment in
    select value from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb))
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
  public.record_visibility, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.create_paw_event(
  uuid, public.dog_event_type, text, text, timestamptz, text,
  public.record_visibility, jsonb, jsonb, jsonb
) to authenticated;

create or replace function public.correct_paw_event(
  p_event_id uuid,
  p_reason text,
  p_title text,
  p_description text,
  p_occurred_at timestamptz,
  p_location_label text,
  p_visibility public.record_visibility,
  p_verification_status public.verification_status
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_moderator() then
    raise exception 'Moderator access is required';
  end if;

  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 500 then
    raise exception 'A correction reason between 1 and 500 characters is required';
  end if;

  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 160 then
    raise exception 'The event title must contain between 1 and 160 characters';
  end if;

  if p_occurred_at > now() + interval '5 minutes' then
    raise exception 'The event time cannot be in the future';
  end if;

  perform set_config('app.event_change_reason', trim(p_reason), true);

  update public.dog_events
  set title = trim(p_title),
      description = nullif(trim(p_description), ''),
      occurred_at = p_occurred_at,
      location_label = nullif(trim(p_location_label), ''),
      visibility = p_visibility,
      verification_status = p_verification_status
  where id = p_event_id;

  if not found then
    raise exception 'The event could not be found or corrected';
  end if;

  return p_event_id;
end;
$$;

revoke all on function public.correct_paw_event(
  uuid, text, text, text, timestamptz, text,
  public.record_visibility, public.verification_status
) from public, anon;
grant execute on function public.correct_paw_event(
  uuid, text, text, text, timestamptz, text,
  public.record_visibility, public.verification_status
) to authenticated;
