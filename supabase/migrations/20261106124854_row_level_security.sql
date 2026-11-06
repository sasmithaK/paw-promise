-- Explicit Data API grants and RLS policies.
-- Public clients use safe views so exact coordinates and moderation fields
-- are never available through a broad table select.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.dogs enable row level security;
alter table public.dog_photos enable row level security;
alter table public.dog_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_attachments enable row level security;
alter table public.medical_records enable row level security;
alter table public.follow_ups enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select (id, dog_code, name, sex, estimated_age, breed, colour, size,
  distinguishing_features, found_at, found_location_label, public_location,
  location_accuracy_m, sterilisation_status, vaccination_status, record_status,
  created_at, updated_at)
on public.dogs to anon, authenticated;

grant select (id, dog_id, storage_path, caption, is_primary, visibility, created_at)
on public.dog_photos to anon, authenticated;

grant select (id, dog_id, event_type, title, description, occurred_at,
  location_label, verification_status, visibility, created_at, updated_at)
on public.dog_events to anon, authenticated;

grant select on public.profiles, public.user_roles, public.event_participants,
  public.event_attachments, public.medical_records, public.follow_ups,
  public.reports, public.audit_logs to authenticated;

grant usage, select on sequence public.dog_code_seq to authenticated;
grant insert (name, sex, estimated_age, breed, colour, size,
  distinguishing_features, found_at, found_location_label, found_location,
  public_location, location_accuracy_m, sterilisation_status,
  vaccination_status, created_by)
on public.dogs to authenticated;
grant insert (dog_id, storage_path, caption, is_primary, visibility, uploaded_by)
on public.dog_photos to authenticated;
grant insert (dog_id, event_type, title, description, occurred_at,
  location_label, location, details, verification_status, visibility, created_by)
on public.dog_events to authenticated;
grant insert (event_id, user_id, participant_name, context)
on public.event_participants to authenticated;
grant insert (event_id, storage_path, attachment_type, visibility, uploaded_by)
on public.event_attachments to authenticated;
grant insert (dog_id, event_id, provider_name, provider_type, assessment,
  treatment, medication, administered_at, next_due_at, verification_status,
  created_by)
on public.medical_records to authenticated;
grant insert (dog_id, related_event_id, title, description, due_at, assigned_to,
  created_by)
on public.follow_ups to authenticated;
grant insert (dog_id, event_id, reporter_id, reason, description)
on public.reports to authenticated;
grant insert, delete on public.user_roles to authenticated;

grant update (full_name, avatar_path) on public.profiles to authenticated;
grant update (name, sex, estimated_age, breed, colour, size,
  distinguishing_features, found_at, found_location_label, found_location,
  public_location, location_accuracy_m, sterilisation_status,
  vaccination_status, record_status, reviewed_by, reviewed_at, review_note)
on public.dogs to authenticated;
grant update (caption, is_primary, visibility) on public.dog_photos to authenticated;
grant delete on public.dog_photos to authenticated;
grant update (event_type, title, description, occurred_at, location_label,
  location, details, verification_status, visibility)
on public.dog_events to authenticated;
grant update (status, completed_at) on public.follow_ups to authenticated;
grant update (status, reviewed_by, reviewed_at, resolution_note)
on public.reports to authenticated;

create view public.published_dogs
with (security_invoker = true)
as
select
  id,
  'PP-' || lpad(dog_code::text, 6, '0') as paw_code,
  name,
  sex,
  estimated_age,
  breed,
  colour,
  size,
  distinguishing_features,
  found_at,
  found_location_label,
  public_location,
  sterilisation_status,
  vaccination_status,
  created_at,
  updated_at
from public.dogs
where record_status = 'PUBLISHED';

create view public.published_dog_events
with (security_invoker = true)
as
select
  e.id,
  e.dog_id,
  e.event_type,
  e.title,
  e.description,
  e.occurred_at,
  e.location_label,
  e.verification_status,
  e.created_at,
  e.updated_at
from public.dog_events e
join public.dogs d on d.id = e.dog_id
where d.record_status = 'PUBLISHED'
  and e.visibility = 'PUBLIC';

revoke all on public.published_dogs, public.published_dog_events from public;
grant select on public.published_dogs, public.published_dog_events to anon, authenticated;

create policy "Members read own profile and moderators read profiles"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Members update own active basic profile"
on public.profiles for update
to authenticated
using (
  id = (select auth.uid())
  and account_status = 'ACTIVE'
)
with check (
  id = (select auth.uid())
  and account_status = 'ACTIVE'
);

create policy "Users read own roles and moderators read roles"
on public.user_roles for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Only super admins insert roles"
on public.user_roles for insert
to authenticated
with check (
  (select private.current_user_is_admin())
  and user_id <> (select auth.uid())
  and assigned_by = (select auth.uid())
);

create policy "Only super admins delete roles"
on public.user_roles for delete
to authenticated
using (
  (select private.current_user_is_admin())
  and user_id <> (select auth.uid())
);

create policy "Public reads published dogs"
on public.dogs for select
to anon, authenticated
using (record_status = 'PUBLISHED');

create policy "Members read own pending dogs"
on public.dogs for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Active members submit pending dogs"
on public.dogs for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
  and (select private.current_user_is_active())
);

create policy "Members edit own pending dogs"
on public.dogs for update
to authenticated
using (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
  and (select private.current_user_is_active())
)
with check (
  created_by = (select auth.uid())
  and record_status = 'PENDING'
  and reviewed_by is null
  and reviewed_at is null
  and (select private.current_user_is_active())
);

create policy "Moderators review dogs they did not create"
on public.dogs for update
to authenticated
using (
  (select private.current_user_is_moderator())
  and created_by <> (select auth.uid())
)
with check (
  (select private.current_user_is_moderator())
  and created_by <> (select auth.uid())
  and reviewed_by = (select auth.uid())
);

create policy "Public reads approved photos for published dogs"
on public.dog_photos for select
to anon, authenticated
using (
  visibility = 'PUBLIC'
  and exists (
    select 1 from public.dogs d
    where d.id = dog_photos.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Uploaders and moderators read restricted photos"
on public.dog_photos for select
to authenticated
using (
  uploaded_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Members add photos to own pending dogs"
on public.dog_photos for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and visibility = 'PRIVATE'
  and (select private.current_user_is_active())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_photos.dog_id
      and d.created_by = (select auth.uid())
      and d.record_status = 'PENDING'
  )
);

create policy "Uploaders edit photos on own pending dogs"
on public.dog_photos for update
to authenticated
using (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_photos.dog_id
      and d.created_by = (select auth.uid())
      and d.record_status = 'PENDING'
  )
)
with check (
  uploaded_by = (select auth.uid())
  and visibility = 'PRIVATE'
  and (select private.current_user_is_active())
);

create policy "Moderators review photo metadata"
on public.dog_photos for update
to authenticated
using ((select private.current_user_is_moderator()))
with check ((select private.current_user_is_moderator()));

create policy "Uploaders delete photos from own pending dogs"
on public.dog_photos for delete
to authenticated
using (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_photos.dog_id
      and d.created_by = (select auth.uid())
      and d.record_status = 'PENDING'
  )
);

create policy "Public reads public events for published dogs"
on public.dog_events for select
to anon, authenticated
using (
  visibility = 'PUBLIC'
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Contributors and moderators read restricted events"
on public.dog_events for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Active members add events to published dogs"
on public.dog_events for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and verification_status in ('UNVERIFIED', 'EVIDENCE_ATTACHED')
  and (select private.current_user_is_active())
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Moderators amend event records"
on public.dog_events for update
to authenticated
using ((select private.current_user_is_moderator()))
with check ((select private.current_user_is_moderator()));

create policy "Event contributors and moderators read participants"
on public.event_participants for select
to authenticated
using (
  exists (
    select 1 from public.dog_events e
    where e.id = event_participants.event_id
      and (
        e.created_by = (select auth.uid())
        or (select private.current_user_is_moderator())
      )
  )
);

create policy "Event contributors add participants"
on public.event_participants for insert
to authenticated
with check (
  (select private.current_user_is_active())
  and exists (
    select 1 from public.dog_events e
    where e.id = event_participants.event_id
      and e.created_by = (select auth.uid())
  )
);

create policy "Event contributors and moderators read attachments"
on public.event_attachments for select
to authenticated
using (
  uploaded_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Event contributors add private attachments"
on public.event_attachments for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and visibility = 'PRIVATE'
  and (select private.current_user_is_active())
  and exists (
    select 1 from public.dog_events e
    where e.id = event_attachments.event_id
      and e.created_by = (select auth.uid())
  )
);

create policy "Creators and moderators read medical records"
on public.medical_records for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Active members submit unverified medical records"
on public.medical_records for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and verification_status in ('UNVERIFIED', 'EVIDENCE_ATTACHED')
  and (select private.current_user_is_active())
);

create policy "Follow-ups visible to creator assignee and moderators"
on public.follow_ups for select
to authenticated
using (
  created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Active members create follow-ups"
on public.follow_ups for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.current_user_is_active())
);

create policy "Assignees creators and moderators update follow-up status"
on public.follow_ups for update
to authenticated
using (
  created_by = (select auth.uid())
  or assigned_to = (select auth.uid())
  or (select private.current_user_is_moderator())
)
with check (
  (select private.current_user_is_active())
  or (select private.current_user_is_moderator())
);

create policy "Reporters and moderators read reports"
on public.reports for select
to authenticated
using (
  reporter_id = (select auth.uid())
  or (select private.current_user_is_moderator())
);

create policy "Active members create reports"
on public.reports for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'OPEN'
  and reviewed_by is null
  and reviewed_at is null
  and (select private.current_user_is_active())
);

create policy "Moderators resolve reports they did not create"
on public.reports for update
to authenticated
using (
  (select private.current_user_is_moderator())
  and reporter_id <> (select auth.uid())
)
with check (
  (select private.current_user_is_moderator())
  and reporter_id <> (select auth.uid())
  and reviewed_by = (select auth.uid())
);

create policy "Moderators read audit logs"
on public.audit_logs for select
to authenticated
using ((select private.current_user_is_moderator()));
