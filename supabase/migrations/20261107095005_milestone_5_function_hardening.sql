-- Privileged implementations belong outside the exposed Data API schema.
-- Public wrappers run as the caller and delegate to implementations that each
-- independently validate auth.uid(), account state, role, ownership, and input.

alter function public.create_follow_up(uuid,uuid,text,text,timestamptz,uuid) set schema private;
alter function public.update_follow_up_status(uuid,public.follow_up_status) set schema private;
alter function public.resolve_community_report(uuid,public.report_status,text) set schema private;
alter function public.set_member_account_status(uuid,public.account_status,text) set schema private;
alter function public.set_member_role(uuid,public.app_role,boolean,text) set schema private;
alter function public.update_pending_paw(uuid,text,public.dog_sex,text,text,text,text,text,timestamptz,text,text,text) set schema private;

create function public.create_follow_up(
  p_dog_id uuid, p_related_event_id uuid, p_title text, p_description text,
  p_due_at timestamptz, p_assigned_to uuid
) returns uuid language sql security invoker set search_path = ''
as $$ select private.create_follow_up($1,$2,$3,$4,$5,$6) $$;

create function public.update_follow_up_status(p_follow_up_id uuid,p_status public.follow_up_status)
returns uuid language sql security invoker set search_path = ''
as $$ select private.update_follow_up_status($1,$2) $$;

create function public.resolve_community_report(p_report_id uuid,p_status public.report_status,p_resolution_note text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.resolve_community_report($1,$2,$3) $$;

create function public.set_member_account_status(p_user_id uuid,p_status public.account_status,p_reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.set_member_account_status($1,$2,$3) $$;

create function public.set_member_role(p_user_id uuid,p_role public.app_role,p_enabled boolean,p_reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.set_member_role($1,$2,$3,$4) $$;

create function public.update_pending_paw(
  p_dog_id uuid,p_name text,p_sex public.dog_sex,p_estimated_age text,p_breed text,
  p_colour text,p_size text,p_distinguishing_features text,p_found_at timestamptz,
  p_found_location_label text,p_vaccination_status text,p_sterilisation_status text
) returns uuid language sql security invoker set search_path = ''
as $$ select private.update_pending_paw($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) $$;

revoke all on function public.create_follow_up(uuid,uuid,text,text,timestamptz,uuid) from public,anon;
revoke all on function public.update_follow_up_status(uuid,public.follow_up_status) from public,anon;
revoke all on function public.resolve_community_report(uuid,public.report_status,text) from public,anon;
revoke all on function public.set_member_account_status(uuid,public.account_status,text) from public,anon;
revoke all on function public.set_member_role(uuid,public.app_role,boolean,text) from public,anon;
revoke all on function public.update_pending_paw(uuid,text,public.dog_sex,text,text,text,text,text,timestamptz,text,text,text) from public,anon;

grant execute on function public.create_follow_up(uuid,uuid,text,text,timestamptz,uuid) to authenticated;
grant execute on function public.update_follow_up_status(uuid,public.follow_up_status) to authenticated;
grant execute on function public.resolve_community_report(uuid,public.report_status,text) to authenticated;
grant execute on function public.set_member_account_status(uuid,public.account_status,text) to authenticated;
grant execute on function public.set_member_role(uuid,public.app_role,boolean,text) to authenticated;
grant execute on function public.update_pending_paw(uuid,text,public.dog_sex,text,text,text,text,text,timestamptz,text,text,text) to authenticated;
