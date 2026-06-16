-- Run this in the Supabase SQL editor.

create table if not exists changelogs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  repo_name text not null,
  branch text,
  date_from timestamptz,
  date_to timestamptz,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists changelogs_user_id_idx on changelogs (user_id);
create index if not exists changelogs_created_at_idx on changelogs (created_at desc);

-- The backend uses the service key (bypasses RLS) and scopes every query by
-- user_id. If you ever query from the browser with the anon key, enable RLS:
-- alter table changelogs enable row level security;
