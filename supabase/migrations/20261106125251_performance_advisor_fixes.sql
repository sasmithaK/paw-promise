-- Hosted advisor follow-up: index every foreign-key side and consolidate
-- permissive policies that target the same role/action.

create index dog_photos_uploaded_by_idx on public.dog_photos(uploaded_by);
create index dogs_reviewed_by_idx on public.dogs(reviewed_by);
create index event_attachments_uploaded_by_idx on public.event_attachments(uploaded_by);
create index event_participants_user_id_idx on public.event_participants(user_id);
create index follow_ups_created_by_idx on public.follow_ups(created_by);
create index follow_ups_dog_id_idx on public.follow_ups(dog_id);
create index follow_ups_related_event_id_idx on public.follow_ups(related_event_id);
create index medical_records_created_by_idx on public.medical_records(created_by);
create index medical_records_event_id_idx on public.medical_records(event_id);
create index reports_dog_id_idx on public.reports(dog_id);
create index reports_event_id_idx on public.reports(event_id);
create index reports_reporter_id_idx on public.reports(reporter_id);
create index reports_reviewed_by_idx on public.reports(reviewed_by);
create index user_roles_assigned_by_idx on public.user_roles(assigned_by);

drop policy "Public reads published dogs" on public.dogs;
drop policy "Members read own pending dogs" on public.dogs;

create policy "Anonymous reads published dogs"
on public.dogs for select
to anon
using (record_status = 'PUBLISHED');

create policy "Authenticated reads authorised dogs"
on public.dogs for select
to authenticated
using (
  record_status = 'PUBLISHED'
  or created_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

drop policy "Members edit own pending dogs" on public.dogs;
drop policy "Moderators review dogs they did not create" on public.dogs;

create policy "Members edit pending and moderators review dogs"
on public.dogs for update
to authenticated
using (
  (
    created_by = (select auth.uid())
    and record_status = 'PENDING'
    and (select private.current_user_is_active())
  )
  or
  (
    (select private.current_user_is_moderator())
    and created_by <> (select auth.uid())
  )
)
with check (
  (
    created_by = (select auth.uid())
    and record_status = 'PENDING'
    and reviewed_by is null
    and reviewed_at is null
    and (select private.current_user_is_active())
  )
  or
  (
    (select private.current_user_is_moderator())
    and created_by <> (select auth.uid())
    and reviewed_by = (select auth.uid())
  )
);

drop policy "Public reads approved photos for published dogs" on public.dog_photos;
drop policy "Uploaders and moderators read restricted photos" on public.dog_photos;

create policy "Anonymous reads approved photos for published dogs"
on public.dog_photos for select
to anon
using (
  visibility = 'PUBLIC'
  and exists (
    select 1 from public.dogs d
    where d.id = dog_photos.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Authenticated reads authorised photos"
on public.dog_photos for select
to authenticated
using (
  (
    visibility = 'PUBLIC'
    and exists (
      select 1 from public.dogs d
      where d.id = dog_photos.dog_id
        and d.record_status = 'PUBLISHED'
    )
  )
  or uploaded_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);

drop policy "Uploaders edit photos on own pending dogs" on public.dog_photos;
drop policy "Moderators review photo metadata" on public.dog_photos;

create policy "Uploaders edit pending and moderators review photos"
on public.dog_photos for update
to authenticated
using (
  (
    uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.dogs d
      where d.id = dog_photos.dog_id
        and d.created_by = (select auth.uid())
        and d.record_status = 'PENDING'
    )
  )
  or (select private.current_user_is_moderator())
)
with check (
  (
    uploaded_by = (select auth.uid())
    and visibility = 'PRIVATE'
    and (select private.current_user_is_active())
  )
  or (select private.current_user_is_moderator())
);

drop policy "Public reads public events for published dogs" on public.dog_events;
drop policy "Contributors and moderators read restricted events" on public.dog_events;

create policy "Anonymous reads public events for published dogs"
on public.dog_events for select
to anon
using (
  visibility = 'PUBLIC'
  and exists (
    select 1 from public.dogs d
    where d.id = dog_events.dog_id
      and d.record_status = 'PUBLISHED'
  )
);

create policy "Authenticated reads authorised events"
on public.dog_events for select
to authenticated
using (
  (
    visibility = 'PUBLIC'
    and exists (
      select 1 from public.dogs d
      where d.id = dog_events.dog_id
        and d.record_status = 'PUBLISHED'
    )
  )
  or created_by = (select auth.uid())
  or (select private.current_user_is_moderator())
);
