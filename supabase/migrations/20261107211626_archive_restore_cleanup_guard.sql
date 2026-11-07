-- A profile cannot safely return to review while an old approved photograph
-- may still be present in the public Storage bucket.

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
  if target.archive_cleanup_pending then
    raise exception 'Complete public photo cleanup before restoring this profile';
  end if;

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
