-- Milestone 5 completion: abuse controls, follow-up workflow, report
-- resolution, and Super Admin account management.

create or replace function private.registration_within_quota()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.dogs
      where created_by = (select auth.uid()) and record_status = 'PENDING') < 3
    and
    (select count(*) from public.dogs
      where created_by = (select auth.uid())
        and created_at >= now() - interval '24 hours') < 10;
$$;

revoke all on function private.registration_within_quota() from public, anon;
grant execute on function private.registration_within_quota() to authenticated;

create policy "Limit pending and daily paw registrations"
on public.dogs
as restrictive
for insert
to authenticated
with check ((select private.registration_within_quota()));

create or replace function private.reporting_within_quota()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.reports
    where reporter_id = (select auth.uid())
      and created_at >= now() - interval '24 hours') < 20;
$$;

revoke all on function private.reporting_within_quota() from public, anon;
grant execute on function private.reporting_within_quota() to authenticated;

create policy "Limit daily community reports"
on public.reports
as restrictive
for insert
to authenticated
with check ((select private.reporting_within_quota()));

alter table public.follow_ups
  add constraint follow_up_description_length
  check (description is null or char_length(description) <= 2000);

create or replace function public.create_follow_up(
  p_dog_id uuid,
  p_related_event_id uuid,
  p_title text,
  p_description text,
  p_due_at timestamptz,
  p_assigned_to uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  new_id uuid;
  is_moderator boolean;
begin
  if actor is null or not private.current_user_is_active() then
    raise exception 'An active member session is required';
  end if;
  is_moderator := private.current_user_is_moderator();
  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) > 160 then
    raise exception 'A title between 1 and 160 characters is required';
  end if;
  if p_description is not null and char_length(p_description) > 2000 then
    raise exception 'The description must not exceed 2000 characters';
  end if;
  if not exists (
    select 1 from public.dogs d
    where d.id = p_dog_id and (d.record_status = 'PUBLISHED' or is_moderator)
  ) then
    raise exception 'This paw profile is unavailable for follow-up work';
  end if;
  if p_related_event_id is not null and not exists (
    select 1 from public.dog_events e
    where e.id = p_related_event_id and e.dog_id = p_dog_id
  ) then
    raise exception 'The related event does not belong to this paw profile';
  end if;
  if not is_moderator and p_assigned_to is distinct from actor then
    raise exception 'Members may only assign follow-ups to themselves';
  end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.profiles p
    where p.id = p_assigned_to and p.account_status = 'ACTIVE'
  ) then
    raise exception 'The assignee must be an active member';
  end if;

  insert into public.follow_ups (
    dog_id, related_event_id, title, description, due_at,
    assigned_to, status, created_by
  ) values (
    p_dog_id, p_related_event_id, trim(p_title), nullif(trim(p_description), ''),
    p_due_at, coalesce(p_assigned_to, actor), 'OPEN', actor
  ) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.create_follow_up(uuid, uuid, text, text, timestamptz, uuid)
  from public, anon;
grant execute on function public.create_follow_up(uuid, uuid, text, text, timestamptz, uuid)
  to authenticated;

create or replace function public.update_follow_up_status(
  p_follow_up_id uuid,
  p_status public.follow_up_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  item public.follow_ups%rowtype;
begin
  if actor is null or not private.current_user_is_active() then
    raise exception 'An active member session is required';
  end if;
  select * into item from public.follow_ups where id = p_follow_up_id;
  if not found then raise exception 'Follow-up not found'; end if;
  if item.created_by <> actor and item.assigned_to is distinct from actor
    and not private.current_user_is_moderator() then
    raise exception 'You are not allowed to update this follow-up';
  end if;

  update public.follow_ups
  set status = p_status,
      completed_at = case when p_status = 'COMPLETED' then coalesce(completed_at, now()) else null end
  where id = p_follow_up_id;
  return p_follow_up_id;
end;
$$;

revoke all on function public.update_follow_up_status(uuid, public.follow_up_status)
  from public, anon;
grant execute on function public.update_follow_up_status(uuid, public.follow_up_status)
  to authenticated;

create or replace function public.resolve_community_report(
  p_report_id uuid,
  p_status public.report_status,
  p_resolution_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  report_owner uuid;
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_moderator() then
    raise exception 'Moderator access is required';
  end if;
  if p_status not in ('UNDER_REVIEW', 'RESOLVED', 'DISMISSED') then
    raise exception 'Choose a valid review status';
  end if;
  if nullif(trim(p_resolution_note), '') is null
    or char_length(trim(p_resolution_note)) > 2000 then
    raise exception 'A resolution note between 1 and 2000 characters is required';
  end if;
  select reporter_id into report_owner from public.reports where id = p_report_id;
  if not found then raise exception 'Report not found'; end if;
  if report_owner = actor then raise exception 'You cannot review your own report'; end if;

  update public.reports
  set status = p_status,
      reviewed_by = actor,
      reviewed_at = now(),
      resolution_note = trim(p_resolution_note)
  where id = p_report_id;
  return p_report_id;
end;
$$;

revoke all on function public.resolve_community_report(uuid, public.report_status, text)
  from public, anon;
grant execute on function public.resolve_community_report(uuid, public.report_status, text)
  to authenticated;

create or replace function public.set_member_account_status(
  p_user_id uuid,
  p_status public.account_status,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_admin() then
    raise exception 'Super Admin access is required';
  end if;
  if p_user_id = actor then raise exception 'You cannot change your own account status'; end if;
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 500 then
    raise exception 'A reason between 1 and 500 characters is required';
  end if;
  update public.profiles set account_status = p_status where id = p_user_id;
  if not found then raise exception 'Member not found'; end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (actor, 'ACCOUNT_STATUS_REASON', 'profile', p_user_id,
    jsonb_build_object('status', p_status, 'reason', trim(p_reason)));
  return p_user_id;
end;
$$;

revoke all on function public.set_member_account_status(uuid, public.account_status, text)
  from public, anon;
grant execute on function public.set_member_account_status(uuid, public.account_status, text)
  to authenticated;

create or replace function public.set_member_role(
  p_user_id uuid,
  p_role public.app_role,
  p_enabled boolean,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.current_user_is_active()
    or not private.current_user_is_admin() then
    raise exception 'Super Admin access is required';
  end if;
  if p_user_id = actor then raise exception 'You cannot change your own roles'; end if;
  if p_role = 'MEMBER' and not p_enabled then
    raise exception 'The baseline Member role cannot be removed';
  end if;
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 500 then
    raise exception 'A reason between 1 and 500 characters is required';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Member not found';
  end if;
  if p_enabled then
    insert into public.user_roles (user_id, role, assigned_by)
    values (p_user_id, p_role, actor)
    on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (actor, 'ROLE_CHANGE_REASON', 'profile', p_user_id,
    jsonb_build_object('role', p_role, 'enabled', p_enabled, 'reason', trim(p_reason)));
  return p_user_id;
end;
$$;

revoke all on function public.set_member_role(uuid, public.app_role, boolean, text)
  from public, anon;
grant execute on function public.set_member_role(uuid, public.app_role, boolean, text)
  to authenticated;
