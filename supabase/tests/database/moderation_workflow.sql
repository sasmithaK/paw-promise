-- Atomic moderation and independent-review checks. Every change rolls back.
begin;

do $$
declare
  member_id constant uuid := '60000000-0000-4000-8000-000000000001';
  moderator_id constant uuid := '60000000-0000-4000-8000-000000000002';
begin
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (member_id, 'authenticated', 'authenticated', 'moderation-member@paw-promise.test',
      crypt('test-only-password', gen_salt('bf')), now(), '{}',
      '{"full_name":"Moderation Member"}', now(), now()),
    (moderator_id, 'authenticated', 'authenticated', 'moderation-reviewer@paw-promise.test',
      crypt('test-only-password', gen_salt('bf')), now(), '{}',
      '{"full_name":"Moderation Reviewer"}', now(), now());

  insert into public.user_roles (user_id, role, assigned_by)
  values (moderator_id, 'MODERATOR', moderator_id);

  insert into public.dogs (
    id, name, found_at, found_location_label, record_status, created_by
  ) values (
    '60000000-0000-4000-8000-000000000010', 'Atomic Approval Pup', now(),
    'Test locality', 'PENDING', member_id
  );

  insert into public.dog_photos (
    dog_id, storage_path, is_primary, visibility, uploaded_by
  ) values (
    '60000000-0000-4000-8000-000000000010',
    member_id::text || '/atomic-approval.jpg', true, 'PRIVATE', member_id
  );
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true);

do $$
begin
  begin
    perform public.moderate_paw(
      '60000000-0000-4000-8000-000000000010', 'PUBLISH', null
    );
    raise exception 'FAIL: a member reviewed their own submission';
  exception when others then
    if sqlerrm = 'FAIL: a member reviewed their own submission' then raise; end if;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true);

do $$
begin
  begin
    perform public.moderate_paw(
      '60000000-0000-4000-8000-000000000010', 'REJECT', null
    );
    raise exception 'FAIL: rejection without a reason was accepted';
  exception when others then
    if sqlerrm = 'FAIL: rejection without a reason was accepted' then raise; end if;
  end;

  if not exists (
    select 1 from public.dogs
    where id = '60000000-0000-4000-8000-000000000010'
      and record_status = 'PENDING'
  ) then
    raise exception 'FAIL: a rejected transaction left a partial status change';
  end if;
end $$;

select public.moderate_paw(
  '60000000-0000-4000-8000-000000000010', 'PUBLISH', null
);

do $$
begin
  if not exists (
    select 1 from public.dogs
    where id = '60000000-0000-4000-8000-000000000010'
      and record_status = 'PUBLISHED'
      and reviewed_by = '60000000-0000-4000-8000-000000000002'
      and reviewed_at is not null
  ) then
    raise exception 'FAIL: moderator publication was not saved';
  end if;

  if not exists (
    select 1 from public.dog_photos
    where dog_id = '60000000-0000-4000-8000-000000000010'
      and is_primary and visibility = 'PUBLIC'
  ) then
    raise exception 'FAIL: primary photo visibility was not published atomically';
  end if;

  if not exists (
    select 1 from public.audit_logs
    where entity_type = 'dogs'
      and entity_id = '60000000-0000-4000-8000-000000000010'
      and actor_id = '60000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'FAIL: publication was not audited';
  end if;
end $$;

reset role;
rollback;
