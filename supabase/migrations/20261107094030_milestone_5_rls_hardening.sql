-- Keep direct Data API callers under the same follow-up assignment rules as
-- the transactional RPC. A restrictive companion policy strengthens the
-- existing insert policy without removing it.
create policy "Follow-up assignment and relationship integrity"
on public.follow_ups
as restrictive for insert
to authenticated
with check (
  (
    assigned_to is null
    or assigned_to = (select auth.uid())
    or (select private.current_user_is_moderator())
  )
  and (
    related_event_id is null
    or exists (
      select 1 from public.dog_events event
      where event.id = follow_ups.related_event_id
        and event.dog_id = follow_ups.dog_id
    )
  )
);
