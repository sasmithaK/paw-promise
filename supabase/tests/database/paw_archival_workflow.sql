-- Hosted-development permission checks for recoverable paw archival.
-- All fixtures and mutations are rolled back.
begin;

do $$
declare
  member_id constant uuid := '60000000-0000-4000-8000-000000000001';
  moderator_id constant uuid := '60000000-0000-4000-8000-000000000002';
  super_admin_id constant uuid := '60000000-0000-4000-8000-000000000003';
begin
  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (member_id,'authenticated','authenticated','archive-member@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"Archive Member"}',now(),now()),
    (moderator_id,'authenticated','authenticated','archive-moderator@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"Archive Moderator"}',now(),now()),
    (super_admin_id,'authenticated','authenticated','archive-admin@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"Archive Super Admin"}',now(),now());

  insert into public.user_roles (user_id, role, assigned_by) values
    (moderator_id, 'MODERATOR', super_admin_id),
    (super_admin_id, 'SUPER_ADMIN', super_admin_id);

  insert into public.dogs (id, name, found_at, found_location_label, record_status, created_by, reviewed_by, reviewed_at)
  values
    ('61000000-0000-4000-8000-000000000001', 'Archive Test Pup', now(), 'Test locality', 'PUBLISHED', member_id, moderator_id, now()),
    ('61000000-0000-4000-8000-000000000002', 'Moderator Own Pup', now(), 'Test locality', 'PENDING', moderator_id, null, null),
    ('61000000-0000-4000-8000-000000000003', 'Super Admin Own Pup', now(), 'Test locality', 'PENDING', super_admin_id, null, null);

  insert into public.dog_photos (dog_id, storage_path, is_primary, visibility, uploaded_by)
  values ('61000000-0000-4000-8000-000000000001', member_id::text || '/archive-test.jpg', true, 'PUBLIC', member_id);

  insert into public.follow_ups (dog_id, title, assigned_to, created_by)
  values ('61000000-0000-4000-8000-000000000001', 'Open archive test follow-up', member_id, moderator_id);
end $$;

do $$ begin
  if has_function_privilege('anon', 'public.archive_paw(uuid,text,text)', 'EXECUTE') then
    raise exception 'FAIL: anonymous role can archive paw profiles';
  end if;
  if has_function_privilege('anon', 'public.restore_archived_paw(uuid,text)', 'EXECUTE') then
    raise exception 'FAIL: anonymous role can restore paw profiles';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000001', true);

do $$ begin
  begin
    perform public.archive_paw(
      '61000000-0000-4000-8000-000000000001',
      'OTHER',
      'A regular member must not archive this profile.'
    );
    raise exception 'FAIL: member archived a paw profile';
  exception when others then
    if sqlerrm = 'FAIL: member archived a paw profile' then raise; end if;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true);

do $$ begin
  begin
    perform public.archive_paw(
      '61000000-0000-4000-8000-000000000002',
      'TEST_RECORD',
      'A moderator must not remove their own submission.'
    );
    raise exception 'FAIL: moderator archived their own profile';
  exception when others then
    if sqlerrm = 'FAIL: moderator archived their own profile' then raise; end if;
  end;
end $$;

select public.archive_paw(
  '61000000-0000-4000-8000-000000000001',
  'DUPLICATE',
  'This fixture is a confirmed duplicate record for archival testing.'
);

do $$ begin
  if not exists (
    select 1 from public.dogs
    where id = '61000000-0000-4000-8000-000000000001'
      and record_status = 'ARCHIVED'
      and previous_record_status = 'PUBLISHED'
      and archive_category = 'DUPLICATE'
      and archive_cleanup_pending
  ) then raise exception 'FAIL: archive metadata was not saved'; end if;

  if not exists (
    select 1 from public.dog_photos
    where dog_id = '61000000-0000-4000-8000-000000000001'
      and visibility = 'PRIVATE'
  ) then raise exception 'FAIL: archived photograph metadata remained public'; end if;

  if not exists (
    select 1 from public.follow_ups
    where dog_id = '61000000-0000-4000-8000-000000000001'
      and status = 'CANCELLED'
  ) then raise exception 'FAIL: open follow-up was not cancelled'; end if;

  if not exists (
    select 1 from public.audit_logs
    where entity_id = '61000000-0000-4000-8000-000000000001'
      and action = 'PAW_ARCHIVED'
      and new_values->>'reason' = 'This fixture is a confirmed duplicate record for archival testing.'
  ) then raise exception 'FAIL: archive reason was not audited'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000003', true);

do $$ begin
  begin
    perform public.restore_archived_paw(
      '61000000-0000-4000-8000-000000000001',
      'Restoration must wait for public photo cleanup.'
    );
    raise exception 'FAIL: profile restored before public photo cleanup';
  exception when others then
    if sqlerrm = 'FAIL: profile restored before public photo cleanup' then raise; end if;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000002', true);

select public.confirm_paw_archive_cleanup('61000000-0000-4000-8000-000000000001');

do $$ begin
  if (select archive_cleanup_pending from public.dogs where id = '61000000-0000-4000-8000-000000000001') then
    raise exception 'FAIL: Storage cleanup confirmation was not saved';
  end if;
  begin
    perform public.restore_archived_paw(
      '61000000-0000-4000-8000-000000000001',
      'A moderator must not restore an archived profile.'
    );
    raise exception 'FAIL: moderator restored an archived profile';
  exception when others then
    if sqlerrm = 'FAIL: moderator restored an archived profile' then raise; end if;
  end;
end $$;

reset role;
set local role anon;

do $$ begin
  if exists (
    select 1 from public.published_paw_profiles
    where id = '61000000-0000-4000-8000-000000000001'
  ) then raise exception 'FAIL: archived profile remained public'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '60000000-0000-4000-8000-000000000003', true);

select public.restore_archived_paw(
  '61000000-0000-4000-8000-000000000001',
  'The duplicate decision was reversed after an independent review.'
);

-- A Super Admin is the final authority for this workflow. They can archive
-- and restore even their own submission without approval from another user.
select public.archive_paw(
  '61000000-0000-4000-8000-000000000003',
  'TEST_RECORD',
  'Super Admin is removing their own testing record directly.'
);

select public.restore_archived_paw(
  '61000000-0000-4000-8000-000000000003',
  'Super Admin is restoring their own record without secondary approval.'
);

do $$ begin
  if not exists (
    select 1 from public.dogs
    where id = '61000000-0000-4000-8000-000000000001'
      and record_status = 'PENDING'
      and archived_at is null
      and archived_by is null
      and archive_reason is null
      and previous_record_status is null
  ) then raise exception 'FAIL: restored profile did not return to independent review'; end if;

  if not exists (
    select 1 from public.audit_logs
    where entity_id = '61000000-0000-4000-8000-000000000001'
      and action = 'PAW_RESTORED'
  ) then raise exception 'FAIL: restoration was not audited'; end if;

  if not exists (
    select 1 from public.dogs
    where id = '61000000-0000-4000-8000-000000000003'
      and created_by = auth.uid()
      and record_status = 'PENDING'
  ) then raise exception 'FAIL: Super Admin could not archive and restore their own profile directly'; end if;
end $$;

reset role;
rollback;
