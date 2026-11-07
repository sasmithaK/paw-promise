-- Transactional hosted-development checks for the Milestone 3 registry slice.
-- Run as the database owner. All test identities, rows, and objects roll back.
begin;

do $$
declare
  member_a constant uuid := '20000000-0000-4000-8000-000000000001';
  member_b constant uuid := '20000000-0000-4000-8000-000000000002';
  moderator constant uuid := '20000000-0000-4000-8000-000000000003';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (member_a, 'authenticated', 'authenticated', 'slice-a@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Slice Member A"}', now(), now()),
    (member_b, 'authenticated', 'authenticated', 'slice-b@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Slice Member B"}', now(), now()),
    (moderator, 'authenticated', 'authenticated', 'slice-moderator@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Slice Moderator"}', now(), now());

  insert into public.user_roles (user_id, role, assigned_by)
  values (moderator, 'MODERATOR', moderator);

  insert into storage.objects (bucket_id, name, owner_id)
  values ('dog-private-photos', member_a::text || '/milestone-3-test.jpg', member_a::text);
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);

select * from public.register_paw(
  p_primary_photo_path => '20000000-0000-4000-8000-000000000001/milestone-3-test.jpg',
  p_name => 'Milestone Pup',
  p_sex => 'UNKNOWN',
  p_estimated_age => 'Unknown',
  p_breed => 'Mixed breed',
  p_colour => 'Brown',
  p_size => 'MEDIUM',
  p_distinguishing_features => 'White front paw',
  p_found_at => now(),
  p_found_location_label => 'Test locality',
  p_latitude => 7.145678,
  p_longitude => 80.123456,
  p_location_accuracy_m => 12,
  p_discovery_description => 'Observed beside the community hall.',
  p_initial_observation => 'Alert and walking normally.',
  p_vaccination_status => 'UNKNOWN',
  p_sterilisation_status => 'UNKNOWN',
  p_participants => '[{"kind":"NON_MEMBER","name":"Witness","context":"Local resident"}]'::jsonb
);

do $$
begin
  if (select count(id) from public.dogs where created_by = auth.uid() and record_status = 'PENDING') <> 1 then
    raise exception 'FAIL: registration did not create one pending paw';
  end if;
  if (select count(id) from public.dog_events where created_by = auth.uid() and event_type = 'DISCOVERY') <> 1 then
    raise exception 'FAIL: registration did not create the discovery event';
  end if;
  if (select count(id) from public.dog_events where created_by = auth.uid() and event_type = 'DISCOVERY' and location is not null and location_accuracy_m = 12) <> 1 then
    raise exception 'FAIL: registration did not preserve the exact discovery point and accuracy';
  end if;
  if (select count(*) from public.event_participants ep join public.dog_events e on e.id = ep.event_id where e.created_by = auth.uid()) <> 2 then
    raise exception 'FAIL: registration did not preserve contributor and witness participants';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

do $$
begin
  if (select count(id) from public.dogs where name = 'Milestone Pup') <> 0 then
    raise exception 'FAIL: Member B can read Member A pending paw';
  end if;
  if (select count(*) from public.published_paw_profiles where name = 'Milestone Pup') <> 0 then
    raise exception 'FAIL: pending paw leaked through the public profile view';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000003', true);

update public.dog_photos
set visibility = 'PUBLIC'
where dog_id = (select id from public.dogs where name = 'Milestone Pup');

select public.moderate_paw(
  (select id from public.dogs where name = 'Milestone Pup'),
  'PUBLISH',
  'Privacy and photograph reviewed.'
);

do $$
begin
  if (select count(*) from public.audit_logs where entity_type = 'dogs' and action = 'update') < 1 then
    raise exception 'FAIL: moderation did not create an audit entry';
  end if;
end $$;

reset role;
set local role anon;

do $$
begin
  if (select count(*) from public.published_paw_profiles where name = 'Milestone Pup' and primary_photo_path is not null) <> 1 then
    raise exception 'FAIL: published safe profile did not expose the approved photo metadata';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

do $$
begin
  if (select count(*) from public.get_paw_location_points((select id from public.dogs where name = 'Milestone Pup'))) <> 1 then
    raise exception 'FAIL: active member cannot read the published exact discovery point';
  end if;
end $$;

insert into public.dog_events (dog_id, event_type, title, occurred_at, details, visibility, created_by)
values (
  (select id from public.dogs where name = 'Milestone Pup'),
  'FEEDING',
  'Test meal',
  now(),
  '{"foodType":"Rice","waterProvided":true}'::jsonb,
  'PUBLIC',
  auth.uid()
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000003', true);
select set_config('app.event_change_reason', 'Corrected test event title', true);

update public.dog_events
set title = 'Corrected test meal'
where title = 'Test meal';

do $$
begin
  if (select count(*) from public.event_change_log where change_reason = 'Corrected test event title') <> 1 then
    raise exception 'FAIL: event correction was not captured';
  end if;
  if (select count(*) from public.audit_logs where entity_type = 'event_change_log') <> 1 then
    raise exception 'FAIL: event correction was not audited';
  end if;
end $$;

reset role;
rollback;
