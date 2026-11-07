-- Recoverable, audited paw removal. Core history and permanent Paw IDs are
-- retained; public Storage cleanup is tracked separately because Storage and
-- Postgres cannot participate in one transaction.

alter table public.dogs
  add column archived_at timestamptz,
  add column archived_by uuid references public.profiles(id) on delete restrict,
  add column archive_reason text,
  add column archive_category text,
  add column previous_record_status public.dog_record_status,
  add column archive_cleanup_pending boolean not null default false,
  add constraint dogs_archive_metadata_complete check (
    (record_status <> 'ARCHIVED' and archived_at is null and archived_by is null
      and archive_reason is null and archive_category is null
      and previous_record_status is null and archive_cleanup_pending = false)
    or
    (record_status = 'ARCHIVED' and archived_at is not null and archived_by is not null
      and nullif(trim(archive_reason), '') is not null
      and archive_category in ('DUPLICATE','INCORRECT','PRIVACY_SAFETY','TEST_RECORD','OTHER')
      and previous_record_status is not null
      and previous_record_status <> 'ARCHIVED')
  );

create index dogs_archived_at_idx
  on public.dogs(archived_at desc)
  where record_status = 'ARCHIVED';

grant select (
  archived_at, archived_by, archive_reason, archive_category,
  previous_record_status, archive_cleanup_pending
) on public.dogs to authenticated;

create or replace function private.archive_paw(
  p_dog_id uuid,
  p_category text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.dogs%rowtype;
  cleanup_paths text[];
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_moderator() then
    raise exception 'Moderator access is required';
  end if;

  if p_category not in ('DUPLICATE','INCORRECT','PRIVACY_SAFETY','TEST_RECORD','OTHER') then
    raise exception 'Choose a valid removal category';
  end if;
  if nullif(trim(p_reason), '') is null
    or char_length(trim(p_reason)) < 10
    or char_length(trim(p_reason)) > 1000 then
    raise exception 'A removal reason between 10 and 1000 characters is required';
  end if;

  select * into target
  from public.dogs
  where id = p_dog_id
  for update;

  if not found then raise exception 'Paw profile not found'; end if;
  if target.record_status = 'ARCHIVED' then raise exception 'This paw profile is already archived'; end if;
  if target.created_by = actor and not private.current_user_is_admin() then
    raise exception 'Moderators cannot remove their own submissions';
  end if;

  select coalesce(array_agg(storage_path order by created_at), array[]::text[])
  into cleanup_paths
  from public.dog_photos
  where dog_id = p_dog_id and visibility = 'PUBLIC';

  update public.dog_photos
  set visibility = 'PRIVATE'
  where dog_id = p_dog_id and visibility = 'PUBLIC';

  update public.follow_ups
  set status = 'CANCELLED', completed_at = null
  where dog_id = p_dog_id and status in ('OPEN','IN_PROGRESS');

  update public.dogs
  set record_status = 'ARCHIVED',
      archived_at = now(),
      archived_by = actor,
      archive_reason = trim(p_reason),
      archive_category = p_category,
      previous_record_status = target.record_status,
      archive_cleanup_pending = cardinality(cleanup_paths) > 0,
      changes_requested_by = null,
      changes_requested_at = null,
      changes_requested_note = null
  where id = p_dog_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
  values (
    actor,
    'PAW_ARCHIVED',
    'dogs',
    p_dog_id,
    jsonb_build_object('record_status', target.record_status),
    jsonb_build_object('record_status', 'ARCHIVED', 'category', p_category,
      'reason', trim(p_reason), 'public_photo_cleanup_paths', to_jsonb(cleanup_paths))
  );

  return jsonb_build_object(
    'dog_id', p_dog_id,
    'record_status', 'ARCHIVED',
    'cleanup_paths', to_jsonb(cleanup_paths)
  );
end;
$$;

create or replace function private.confirm_paw_archive_cleanup(p_dog_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_moderator() then
    raise exception 'Moderator access is required';
  end if;

  update public.dogs
  set archive_cleanup_pending = false
  where id = p_dog_id and record_status = 'ARCHIVED';
  if not found then raise exception 'Archived paw profile not found'; end if;
  return p_dog_id;
end;
$$;

create or replace function private.restore_archived_paw(
  p_dog_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.dogs%rowtype;
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_admin() then
    raise exception 'Super Admin access is required';
  end if;
  if nullif(trim(p_reason), '') is null
    or char_length(trim(p_reason)) < 10
    or char_length(trim(p_reason)) > 1000 then
    raise exception 'A restoration reason between 10 and 1000 characters is required';
  end if;

  select * into target from public.dogs where id = p_dog_id for update;
  if not found then raise exception 'Paw profile not found'; end if;
  if target.record_status <> 'ARCHIVED' then raise exception 'Only archived profiles can be restored'; end if;

  update public.dogs
  set record_status = 'PENDING',
      reviewed_by = null,
      reviewed_at = null,
      review_note = null,
      archived_at = null,
      archived_by = null,
      archive_reason = null,
      archive_category = null,
      previous_record_status = null,
      archive_cleanup_pending = false
  where id = p_dog_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
  values (
    actor,
    'PAW_RESTORED',
    'dogs',
    p_dog_id,
    jsonb_build_object('record_status', 'ARCHIVED', 'archived_at', target.archived_at,
      'archived_by', target.archived_by, 'category', target.archive_category,
      'reason', target.archive_reason),
    jsonb_build_object('record_status', 'PENDING', 'reason', trim(p_reason))
  );

  return 'PENDING';
end;
$$;

create function public.archive_paw(p_dog_id uuid, p_category text, p_reason text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.archive_paw($1,$2,$3) $$;

create function public.confirm_paw_archive_cleanup(p_dog_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.confirm_paw_archive_cleanup($1) $$;

create function public.restore_archived_paw(p_dog_id uuid, p_reason text)
returns text
language sql
security invoker
set search_path = ''
as $$ select private.restore_archived_paw($1,$2) $$;

revoke all on function private.archive_paw(uuid,text,text) from public,anon;
revoke all on function private.confirm_paw_archive_cleanup(uuid) from public,anon;
revoke all on function private.restore_archived_paw(uuid,text) from public,anon;
revoke all on function public.archive_paw(uuid,text,text) from public,anon;
revoke all on function public.confirm_paw_archive_cleanup(uuid) from public,anon;
revoke all on function public.restore_archived_paw(uuid,text) from public,anon;

grant execute on function private.archive_paw(uuid,text,text) to authenticated;
grant execute on function private.confirm_paw_archive_cleanup(uuid) to authenticated;
grant execute on function private.restore_archived_paw(uuid,text) to authenticated;
grant execute on function public.archive_paw(uuid,text,text) to authenticated;
grant execute on function public.confirm_paw_archive_cleanup(uuid) to authenticated;
grant execute on function public.restore_archived_paw(uuid,text) to authenticated;
