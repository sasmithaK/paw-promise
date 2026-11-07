-- Hosted-development permission checks for Milestone 5. Every row rolls back.
begin;

do $$
declare
  member_a constant uuid := '50000000-0000-4000-8000-000000000001';
  member_b constant uuid := '50000000-0000-4000-8000-000000000002';
  moderator constant uuid := '50000000-0000-4000-8000-000000000003';
  super_admin constant uuid := '50000000-0000-4000-8000-000000000004';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (member_a,'authenticated','authenticated','m5-a@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"M5 Member A"}',now(),now()),
    (member_b,'authenticated','authenticated','m5-b@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"M5 Member B"}',now(),now()),
    (moderator,'authenticated','authenticated','m5-mod@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"M5 Moderator"}',now(),now()),
    (super_admin,'authenticated','authenticated','m5-admin@paw-promise.test',crypt('test-only-password',gen_salt('bf')),now(),'{}','{"full_name":"M5 Super Admin"}',now(),now());
  insert into public.user_roles(user_id,role,assigned_by)
  values (moderator,'MODERATOR',super_admin),(super_admin,'SUPER_ADMIN',super_admin);
  insert into public.dogs(name,found_at,found_location_label,record_status,created_by,reviewed_by,reviewed_at)
  values ('Milestone Five Pup',now(),'Workflow locality','PUBLISHED',member_a,moderator,now());
end $$;

do $$ begin
  if has_function_privilege('anon','public.create_follow_up(uuid, uuid, text, text, timestamptz, uuid)','EXECUTE') then raise exception 'FAIL: anon can create follow-ups'; end if;
  if has_function_privilege('anon','public.resolve_community_report(uuid, public.report_status, text)','EXECUTE') then raise exception 'FAIL: anon can resolve reports'; end if;
  if has_function_privilege('anon','public.set_member_role(uuid, public.app_role, boolean, text)','EXECUTE') then raise exception 'FAIL: anon can manage roles'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000001',true);

select public.create_follow_up(
  (select id from public.dogs where name='Milestone Five Pup'),null,
  'Member-created task','Coordinate care',now()+interval '1 day',auth.uid()
);

do $$ begin
  begin
    insert into public.follow_ups(dog_id,title,assigned_to,created_by)
    values ((select id from public.dogs where name='Milestone Five Pup'),'Invalid assignment','50000000-0000-4000-8000-000000000002',auth.uid());
    raise exception 'FAIL: member assigned a direct follow-up to another member';
  exception when others then
    if sqlerrm='FAIL: member assigned a direct follow-up to another member' then raise; end if;
  end;

  insert into public.reports(dog_id,reporter_id,reason,description)
  values ((select id from public.dogs where name='Milestone Five Pup'),auth.uid(),'Profile information concern','Please verify this record.');

  insert into public.dogs(name,found_at,found_location_label,created_by)
  values ('Quota One',now(),'Quota locality',auth.uid()),('Quota Two',now(),'Quota locality',auth.uid()),('Quota Three',now(),'Quota locality',auth.uid());
  perform public.update_pending_paw(
    (select id from public.dogs where name='Quota One'),
    'Quota One Updated','UNKNOWN','','Mixed breed','Brown','MEDIUM','White chest',
    now(),'Updated quota locality','UNKNOWN','UNKNOWN'
  );
  if not exists(select 1 from public.dogs where name='Quota One Updated' and created_by=auth.uid()) then
    raise exception 'FAIL: owner could not update a pending profile';
  end if;
  begin
    insert into public.dogs(name,found_at,found_location_label,created_by)
    values ('Quota Four',now(),'Quota locality',auth.uid());
    raise exception 'FAIL: pending registration quota was bypassed';
  exception when others then
    if sqlerrm='FAIL: pending registration quota was bypassed' then raise; end if;
  end;

  begin
    perform public.set_member_role('50000000-0000-4000-8000-000000000002','MODERATOR',true,'unauthorised');
    raise exception 'FAIL: member managed privileged roles';
  exception when others then
    if sqlerrm='FAIL: member managed privileged roles' then raise; end if;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000003',true);

select public.create_follow_up(
  (select id from public.dogs where name='Milestone Five Pup'),null,
  'Moderator-assigned task','Assigned independently',now()+interval '2 days','50000000-0000-4000-8000-000000000002'
);
select public.resolve_community_report(
  (select id from public.reports where reason='Profile information concern'),
  'RESOLVED','Reviewed against the source record.'
);

do $$ begin
  if (select count(*) from public.follow_ups where assigned_to='50000000-0000-4000-8000-000000000002')<>1 then raise exception 'FAIL: moderator assignment was not saved'; end if;
  if (select count(*) from public.reports where status='RESOLVED' and reviewed_by=auth.uid())<>1 then raise exception 'FAIL: report was not resolved'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000002',true);
select public.update_follow_up_status(
  (select id from public.follow_ups where title='Moderator-assigned task'),'COMPLETED'
);

do $$ begin
  if (select count(*) from public.follow_ups where title='Moderator-assigned task' and status='COMPLETED' and completed_at is not null)<>1 then raise exception 'FAIL: assignee could not complete a follow-up'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000004',true);

select public.set_member_role('50000000-0000-4000-8000-000000000002','MODERATOR',true,'Approved for moderation testing');
select public.set_member_account_status('50000000-0000-4000-8000-000000000001','SUSPENDED','Testing account-state enforcement');

do $$ begin
  if not exists(select 1 from public.user_roles where user_id='50000000-0000-4000-8000-000000000002' and role='MODERATOR') then raise exception 'FAIL: Super Admin role grant failed'; end if;
  if not exists(select 1 from public.profiles where id='50000000-0000-4000-8000-000000000001' and account_status='SUSPENDED') then raise exception 'FAIL: Super Admin suspension failed'; end if;
  if (select count(*) from public.audit_logs where action in ('ROLE_CHANGE_REASON','ACCOUNT_STATUS_REASON'))<>2 then raise exception 'FAIL: management reasons were not audited'; end if;
end $$;

reset role;
rollback;
