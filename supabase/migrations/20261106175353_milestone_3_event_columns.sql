-- Authenticated workspace views filter and label a member's own contributions.
-- Row visibility remains governed by the existing event RLS policies.
grant select (created_by) on public.dog_events to authenticated;
