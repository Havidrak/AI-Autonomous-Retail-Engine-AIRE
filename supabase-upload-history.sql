create extension if not exists pgcrypto;

create table if not exists public.upload_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signature text not null,
  file_name text not null,
  file_type text,
  file_size bigint default 0,
  rows integer default 0,
  columns integer default 0,
  storage_bucket text not null default 'aire-uploads',
  storage_path text not null,
  dataset_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, signature)
);

create or replace function public.set_upload_history_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_upload_history_updated_at on public.upload_history;

create trigger set_upload_history_updated_at
before update on public.upload_history
for each row
execute function public.set_upload_history_updated_at();

alter table public.upload_history enable row level security;

grant select, insert, update, delete on public.upload_history to authenticated;

drop policy if exists "AIRE users can read own upload history" on public.upload_history;
create policy "AIRE users can read own upload history" on public.upload_history for select to authenticated using (auth.uid() = user_id);

drop policy if exists "AIRE users can insert own upload history" on public.upload_history;
create policy "AIRE users can insert own upload history" on public.upload_history for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "AIRE users can update own upload history" on public.upload_history;
create policy "AIRE users can update own upload history" on public.upload_history for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "AIRE users can delete own upload history" on public.upload_history;
create policy "AIRE users can delete own upload history" on public.upload_history for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('aire-uploads', 'aire-uploads', false, 524288000)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "AIRE users can upload own files" on storage.objects;
create policy "AIRE users can upload own files" on storage.objects for insert to authenticated with check (bucket_id = 'aire-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "AIRE users can read own files" on storage.objects;
create policy "AIRE users can read own files" on storage.objects for select to authenticated using (bucket_id = 'aire-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "AIRE users can update own files" on storage.objects;
create policy "AIRE users can update own files" on storage.objects for update to authenticated using (bucket_id = 'aire-uploads' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'aire-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "AIRE users can delete own files" on storage.objects;
create policy "AIRE users can delete own files" on storage.objects for delete to authenticated using (bucket_id = 'aire-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
