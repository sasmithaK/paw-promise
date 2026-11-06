-- Workspace ownership filters and moderation screens need these columns, while
-- anonymous clients must continue to receive only the safe public projection.
grant select (
  created_by,
  reviewed_by,
  reviewed_at,
  review_note,
  changes_requested_by,
  changes_requested_at,
  changes_requested_note
) on public.dogs to authenticated;
