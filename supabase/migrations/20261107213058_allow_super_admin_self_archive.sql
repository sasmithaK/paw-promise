-- ARCHIVED is a governance state, not an approval decision. A Super Admin may
-- archive any record (including their own pending submission) without a
-- second reviewer. Publication and rejection retain independent-review rules.

alter table public.dogs
  drop constraint review_actor_is_not_creator,
  drop constraint review_fields_consistent;

alter table public.dogs
  add constraint review_actor_is_not_creator check (
    record_status = 'ARCHIVED'
    or reviewed_by is null
    or reviewed_by <> created_by
  ),
  add constraint review_fields_consistent check (
    (record_status = 'PENDING' and reviewed_by is null and reviewed_at is null)
    or record_status = 'ARCHIVED'
    or (record_status in ('PUBLISHED','REJECTED') and reviewed_by is not null and reviewed_at is not null)
  );
