-- Storage rules for the public "avatars" bucket.
-- Run once in Supabase (SQL editor) or via: node scripts/apply-storage-policies.js
-- Each signed-in user may only write files inside a folder named after their
-- auth user id, e.g. avatars/<auth.uid()>/avatar-1700000000000.jpg
-- Public URLs keep working for everyone because the bucket is public.

drop policy if exists "avatars: read own folder" on storage.objects;
drop policy if exists "avatars: upload to own folder" on storage.objects;
drop policy if exists "avatars: update own folder" on storage.objects;
drop policy if exists "avatars: delete own folder" on storage.objects;

create policy "avatars: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
