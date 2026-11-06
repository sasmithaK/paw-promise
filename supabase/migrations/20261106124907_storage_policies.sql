-- Storage buckets and object policies. Pending and sensitive material stays private.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('dog-public-photos', 'dog-public-photos', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('dog-private-photos', 'dog-private-photos', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('event-evidence', 'event-evidence', false, 15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('medical-documents', 'medical-documents', false, 15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('user-avatars', 'user-avatars', false, 5242880,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone reads approved public paw photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'dog-public-photos');

create policy "Moderators publish approved paw photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dog-public-photos'
  and (select private.current_user_is_moderator())
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp'])
);

create policy "Moderators replace approved paw photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'dog-public-photos'
  and (select private.current_user_is_moderator())
)
with check (
  bucket_id = 'dog-public-photos'
  and (select private.current_user_is_moderator())
);

create policy "Members upload private paw photos to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'dog-private-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp'])
  and (select private.current_user_is_active())
);

create policy "Owners and moderators read private paw photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'dog-private-photos'
  and (
    owner_id = (select auth.uid())::text
    or (select private.current_user_is_moderator())
  )
);

create policy "Owners replace private paw photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'dog-private-photos'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
)
with check (
  bucket_id = 'dog-private-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_is_active())
);

create policy "Owners delete private paw photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'dog-private-photos'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
);

create policy "Members upload event evidence to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp', 'pdf'])
  and (select private.current_user_is_active())
);

create policy "Owners and moderators read event evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'event-evidence'
  and (
    owner_id = (select auth.uid())::text
    or (select private.current_user_is_moderator())
  )
);

create policy "Owners replace event evidence"
on storage.objects for update
to authenticated
using (
  bucket_id = 'event-evidence'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
)
with check (
  bucket_id = 'event-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_is_active())
);

create policy "Members upload medical documents to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp', 'pdf'])
  and (select private.current_user_is_active())
);

create policy "Owners and moderators read medical documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'medical-documents'
  and (
    owner_id = (select auth.uid())::text
    or (select private.current_user_is_moderator())
  )
);

create policy "Owners replace medical documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'medical-documents'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
)
with check (
  bucket_id = 'medical-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_is_active())
);

create policy "Members upload avatar to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp'])
  and (select private.current_user_is_active())
);

create policy "Owners and moderators read avatars"
on storage.objects for select
to authenticated
using (
  bucket_id = 'user-avatars'
  and (
    owner_id = (select auth.uid())::text
    or (select private.current_user_is_moderator())
  )
);

create policy "Owners replace avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'user-avatars'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
)
with check (
  bucket_id = 'user-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_is_active())
);

create policy "Owners delete avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'user-avatars'
  and owner_id = (select auth.uid())::text
  and (select private.current_user_is_active())
);
