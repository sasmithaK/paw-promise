-- Hosted-development permission checks for Milestone 4. Every row rolls back.
begin;

do $$
declare
  owner_id constant uuid := '30000000-0000-4000-8000-000000000001';
  contributor_id constant uuid := '30000000-0000-4000-8000-000000000002';
  moderator_id constant uuid := '30000000-0000-4000-8000-000000000003';
  suspended_id constant uuid := '30000000-0000-4000-8000-000000000004';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (owner_id, 'authenticated', 'authenticated', 'event-owner@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Event Owner"}', now(), now()),
    (contributor_id, 'authenticated', 'authenticated', 'event-contributor@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Event Contributor"}', now(), now()),
    (moderator_id, 'authenticated', 'authenticated', 'event-moderator@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Event Moderator"}', now(), now()),
    (suspended_id, 'authenticated', 'authenticated', 'event-suspended@paw-promise.test', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Suspended Member"}', now(), now());

  insert into public.user_roles (user_id, role, assigned_by)
  values (moderator_id, 'MODERATOR', moderator_id);
  update public.profiles set account_status = 'SUSPENDED' where id = suspended_id;

  insert into public.dogs (name, found_at, found_location_label, record_status, created_by, reviewed_by, reviewed_at)
  values
    ('Milestone Four Pup', now(), 'Test locality', 'PUBLISHED', owner_id, moderator_id, now()),
    ('Different Test Pup', now(), 'Other locality', 'PUBLISHED', owner_id, moderator_id, now());

  insert into storage.objects (bucket_id, name, owner_id)
  values ('event-evidence', contributor_id::text || '/event-test.pdf', contributor_id::text);
end $$;

do $$
begin
  if has_function_privilege('anon', 'public.create_paw_event(uuid, public.dog_event_type, text, text, timestamptz, text, public.record_visibility, double precision, double precision, integer, jsonb, jsonb, jsonb)', 'EXECUTE') then
    raise exception 'FAIL: anonymous role can execute authenticated event RPC';
  end if;
  if has_function_privilege('anon', 'public.get_paw_location_points(uuid)', 'EXECUTE') then
    raise exception 'FAIL: anonymous role can execute the member location RPC';
  end if;
  if has_column_privilege('anon', 'public.dog_events', 'location', 'SELECT') then
    raise exception 'FAIL: anonymous role can select exact event coordinates';
  end if;
  if not has_column_privilege('authenticated', 'public.dog_events', 'location', 'SELECT') then
    raise exception 'FAIL: authenticated role cannot select authorised exact event coordinates';
  end if;
  if has_function_privilege('anon', 'public.correct_paw_event(uuid, text, text, text, timestamptz, text, public.record_visibility, public.verification_status)', 'EXECUTE') then
    raise exception 'FAIL: anonymous role can execute moderator correction RPC';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

select public.create_paw_event(
  p_dog_id => (select id from public.dogs where name = 'Milestone Four Pup'),
  p_event_type => 'VETERINARY_VISIT',
  p_title => 'Clinic assessment',
  p_description => 'A veterinary professional examined the pup.',
  p_occurred_at => now(),
  p_location_label => 'Test clinic area',
  p_visibility => 'PUBLIC',
  p_latitude => 7.145678,
  p_longitude => 80.123456,
  p_location_accuracy_m => 12,
  p_details => '{"providerName":"Test Clinic","visitOutcome":"Follow-up recommended"}'::jsonb,
  p_participants => '[{"name":"Test Witness","context":"Volunteer"}]'::jsonb,
  p_attachments => '[{"storagePath":"30000000-0000-4000-8000-000000000002/event-test.pdf","attachmentType":"application/pdf"}]'::jsonb
);

do $$
begin
  if (select count(*) from public.dog_events where created_by = auth.uid() and verification_status = 'EVIDENCE_ATTACHED') <> 1 then
    raise exception 'FAIL: transactional event creation did not mark attached evidence';
  end if;
  if (select count(*) from public.event_participants participant join public.dog_events event on event.id = participant.event_id where event.created_by = auth.uid()) <> 2 then
    raise exception 'FAIL: contributor and additional participant were not committed together';
  end if;
  if (select count(*) from public.event_attachments attachment join public.dog_events event on event.id = attachment.event_id where event.created_by = auth.uid()) <> 1 then
    raise exception 'FAIL: attachment metadata was not committed with the event';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);

do $$
begin
  if (select count(*) from public.dog_events where title = 'Clinic assessment') <> 1 then
    raise exception 'FAIL: authenticated member cannot read a public published event';
  end if;
  if (select count(*) from public.get_paw_location_points((select id from public.dogs where name = 'Milestone Four Pup')) where accuracy_m = 12) <> 1 then
    raise exception 'FAIL: authenticated member cannot read the exact event point';
  end if;
  if (select count(*) from public.event_participants) <> 0 then
    raise exception 'FAIL: participant identity leaked to a different member';
  end if;
  if (select count(*) from public.event_attachments) <> 0 then
    raise exception 'FAIL: private attachment metadata leaked to a different member';
  end if;

  insert into public.reports (dog_id, event_id, reporter_id, reason, description)
  select dog_id, id, auth.uid(), 'Incorrect event information', 'Please verify the date.'
  from public.dog_events where title = 'Clinic assessment';

  if (select count(*) from public.reports where reporter_id = auth.uid()) <> 1 then
    raise exception 'FAIL: authenticated report workflow did not create the member report';
  end if;

  begin
    insert into public.reports (dog_id, event_id, reporter_id, reason)
    select
      (select id from public.dogs where name = 'Different Test Pup'),
      id,
      auth.uid(),
      'Mismatched event report'
    from public.dog_events where title = 'Clinic assessment';
    raise exception 'FAIL: mismatched event report was accepted';
  exception
    when others then
      if sqlerrm = 'FAIL: mismatched event report was accepted' then raise; end if;
  end;

  begin
    insert into public.dog_events (
      dog_id, event_type, title, occurred_at, details, visibility, created_by
    ) values (
      (select id from public.dogs where name = 'Milestone Four Pup'),
      'HEALTH_OBSERVATION', 'Invalid diagnosis claim', now(),
      '{"observedSigns":["wound"],"professionalDiagnosis":true}'::jsonb,
      'PUBLIC', auth.uid()
    );
    raise exception 'FAIL: direct Data API style insert bypassed structured validation';
  exception
    when others then
      if sqlerrm = 'FAIL: direct Data API style insert bypassed structured validation' then raise; end if;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);

do $$
begin
  begin
    perform public.create_paw_event(
      (select id from public.dogs where name = 'Milestone Four Pup'),
      'SIGHTING', 'Blocked update', '', now(), '', 'PUBLIC', 7.1, 80.1, 10, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb
    );
    raise exception 'FAIL: suspended member created an event';
  exception
    when others then
      if sqlerrm = 'FAIL: suspended member created an event' then raise; end if;
  end;
  if (select count(*) from public.get_paw_location_points((select id from public.dogs where name = 'Milestone Four Pup'))) <> 0 then
    raise exception 'FAIL: suspended member can read exact location points';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);

select public.correct_paw_event(
  p_event_id => (select id from public.dog_events where title = 'Clinic assessment'),
  p_reason => 'Corrected after reviewing submitted evidence',
  p_title => 'Verified clinic assessment',
  p_description => 'A veterinary professional examined the pup.',
  p_occurred_at => now(),
  p_location_label => 'Test clinic area',
  p_visibility => 'PUBLIC',
  p_verification_status => 'VERIFIED'
);

do $$
begin
  if (select count(*) from public.event_change_log where change_reason = 'Corrected after reviewing submitted evidence') <> 1 then
    raise exception 'FAIL: moderator correction reason was not preserved';
  end if;
  if (select count(*) from public.audit_logs where entity_type = 'event_change_log') <> 1 then
    raise exception 'FAIL: moderator event correction was not audited';
  end if;
  if (select count(*) from public.reports where reason = 'Incorrect event information') <> 1 then
    raise exception 'FAIL: moderator cannot read submitted event report';
  end if;
end $$;

reset role;
rollback;
