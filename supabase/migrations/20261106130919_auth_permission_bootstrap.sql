-- One-time bootstrap for the first Super Admin.
-- This function lives in the unexposed private schema and can only be called
-- by the database owner from the Supabase SQL editor or an equivalent trusted
-- migration context. It refuses to run after a Super Admin already exists.

create or replace function private.bootstrap_first_super_admin(target_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = target_user) then
    raise exception 'The target user does not have a Paw Promise profile';
  end if;

  if exists (
    select 1 from public.user_roles where role = 'SUPER_ADMIN'
  ) then
    raise exception 'A Super Admin already exists; use the audited role-management workflow';
  end if;

  insert into public.user_roles (user_id, role, assigned_by)
  values (target_user, 'SUPER_ADMIN', target_user);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, new_values)
  values (
    target_user,
    'BOOTSTRAP_SUPER_ADMIN',
    'user',
    target_user,
    jsonb_build_object('role', 'SUPER_ADMIN')
  );
end;
$$;

revoke all on function private.bootstrap_first_super_admin(uuid)
from public, anon, authenticated, service_role;
grant execute on function private.bootstrap_first_super_admin(uuid) to postgres;
