-- Transactional hosted-development checks for signup triggers and RLS.
-- Run as the database owner. Everything rolls back, including test identities.
begin;

do $$
declare
  member_a constant uuid := '10000000-0000-4000-8000-000000000001';
  member_b constant uuid := '10000000-0000-4000-8000-000000000002';
  moderator constant uuid := '10000000-0000-4000-8000-000000000003';
  super_admin constant uuid := '10000000-0000-4000-8000-000000000004';
  suspended constant uuid := '10000000-0000-4000-8000-000000000005';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (member_a, 'authenticated', 'authenticated', 'member-a@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Member A"}', now(), now()),
    (member_b, 'authenticated', 'authenticated', 'member-b@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Member B"}', now(), now()),
    (moderator, 'authenticated', 'authenticated', 'moderator@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Moderator"}', now(), now()),
    (super_admin, 'authenticated', 'authenticated', 'super-admin@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Super Admin"}', now(), now()),
    (suspended, 'authenticated', 'authenticated', 'suspended@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Suspended Member"}', now(), now());

  if (select count(*) from public.profiles where id in (member_a, member_b, moderator, super_admin, suspended)) <> 5 then
    raise exception 'FAIL: signup trigger did not create every profile';
  end if;
  if (select count(*) from public.user_roles where user_id in (member_a, member_b, moderator, super_admin, suspended) and role = 'MEMBER') <> 5 then
    raise exception 'FAIL: signup trigger did not assign MEMBER to every identity';
  end if;

  insert into public.user_roles (user_id, role, assigned_by)
  values (moderator, 'MODERATOR', super_admin), (super_admin, 'SUPER_ADMIN', super_admin);

  update public.profiles set account_status = 'SUSPENDED' where id = suspended;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'FAIL: a member can read another member profile';
  end if;
  if (select count(*) from public.user_roles) <> 1 then
    raise exception 'FAIL: a member can read another member role';
  end if;

  begin
    insert into public.user_roles (user_id, role, assigned_by)
    values (
      '10000000-0000-4000-8000-000000000001',
      'SUPER_ADMIN',
      '10000000-0000-4000-8000-000000000001'
    );
    raise exception 'FAIL: member assigned a privileged role';
  exception when insufficient_privilege then
    null;
  end;

  update public.profiles set full_name = 'Tampered' where id = '10000000-0000-4000-8000-000000000002';
  if found then raise exception 'FAIL: member updated another profile'; end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

do $$
begin
  if (select count(*) from public.profiles) <> 5 then
    raise exception 'FAIL: moderator cannot read profiles needed for moderation';
  end if;
  if (select count(*) from public.user_roles) <> 7 then
    raise exception 'FAIL: moderator cannot read roles needed for moderation';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);

do $$
begin
  begin
    insert into public.dogs (name, found_at, found_location_label, created_by)
    values ('Blocked submission', now(), 'Test locality', '10000000-0000-4000-8000-000000000005');
    raise exception 'FAIL: suspended member created a paw profile';
  exception when insufficient_privilege then
    null;
  end;
end $$;

reset role;
rollback;
