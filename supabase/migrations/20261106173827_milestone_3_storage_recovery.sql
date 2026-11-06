-- Allow a moderator Server Action to remove a copied public photograph if the
-- database moderation transaction fails. This is recovery-only; metadata and
-- paw publication remain controlled independently by RLS and moderate_paw().
create policy "Moderators remove failed public paw photo copies"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'dog-public-photos'
  and (select private.current_user_is_moderator())
);
