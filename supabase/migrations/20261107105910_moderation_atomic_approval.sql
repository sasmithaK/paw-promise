-- Make moderation state changes atomic inside Postgres. Storage object copying
-- remains an application concern, but the photo visibility and paw status now
-- succeed or fail together and retries cannot leave public database metadata
-- on a pending profile.

create or replace function private.moderate_paw(
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

  select * into target
  from public.dogs
  where id = p_dog_id
  for update;

  if not found then raise exception 'Paw profile not found'; end if;
  if target.created_by = actor then
    raise exception 'Moderators cannot review their own submissions';
  end if;
  if target.record_status <> 'PENDING' then
    raise exception 'Only pending profiles can be reviewed';
  end if;

  if p_decision = 'PUBLISH' then
    if not exists (
      select 1
      from public.dog_photos
      where dog_id = p_dog_id and is_primary
    ) then
      raise exception 'A primary photograph is required before publishing';
    end if;

    update public.dog_photos
    set visibility = 'PUBLIC'
    where dog_id = p_dog_id and is_primary;

    next_status := 'PUBLISHED';
  elsif p_decision = 'REJECT' then
    if nullif(trim(p_note), '') is null then
      raise exception 'A reason is required when rejecting a profile';
    end if;
    next_status := 'REJECTED';
  elsif p_decision = 'REQUEST_CHANGES' then
    if nullif(trim(p_note), '') is null then
      raise exception 'A note is required when requesting changes';
    end if;

    update public.dogs
    set changes_requested_by = actor,
        changes_requested_at = now(),
        changes_requested_note = trim(p_note)
    where id = p_dog_id;

    return 'PENDING';
  else
    raise exception 'Unsupported moderation decision';
  end if;

  update public.dogs
  set record_status = next_status,
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

revoke all on function private.moderate_paw(uuid, text, text)
  from public, anon;
grant execute on function private.moderate_paw(uuid, text, text)
  to authenticated;
