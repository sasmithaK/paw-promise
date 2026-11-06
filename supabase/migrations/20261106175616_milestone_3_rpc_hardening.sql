-- Registration can run entirely under the caller's RLS context once the
-- discovery-event insert policy explicitly permits the initial pending event.
create policy "Members add discovery event to own pending paw"
on public.dog_events for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and event_type = 'DISCOVERY'
  and verification_status in ('UNVERIFIED', 'EVIDENCE_ATTACHED')
  and (select private.current_user_is_active())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.created_by = (select auth.uid())
      and d.record_status = 'PENDING'
  )
);

alter function public.register_paw(
  text, text, public.dog_sex, text, text, text, text, text, timestamptz, text,
  double precision, double precision, integer, text, text, text, text, jsonb
) security invoker;

-- Moderation needs one tightly scoped privilege boundary because request-change
-- metadata is written independently of the final review fields. Keep the
-- definer implementation outside the exposed API schema and expose only an
-- invoker wrapper that performs the same authenticated checks internally.
alter function public.moderate_paw(uuid, text, text) set schema private;

revoke all on function private.moderate_paw(uuid, text, text) from public, anon;
grant execute on function private.moderate_paw(uuid, text, text) to authenticated;

create function public.moderate_paw(
  p_dog_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.moderate_paw(p_dog_id, p_decision, p_note);
$$;

revoke all on function public.moderate_paw(uuid, text, text) from public, anon;
grant execute on function public.moderate_paw(uuid, text, text) to authenticated;
