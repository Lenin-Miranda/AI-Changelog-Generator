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

-- Only the server's service_role may access saved private repository content.
-- GitHub OAuth identities are verified by NestJS; they are not Supabase Auth IDs.
alter table public.changelogs enable row level security;
revoke all on table public.changelogs from public, anon, authenticated;
grant select, insert, update, delete on table public.changelogs to service_role;

-- Reservations bound model consumption across replicas and restarts.
create table if not exists public.generation_requests (
  id uuid primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  active_until timestamptz not null default (now() + interval '3 minutes')
);
create index if not exists generation_requests_created_at_idx on public.generation_requests (created_at);
alter table public.generation_requests enable row level security;
revoke all on table public.generation_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.generation_requests to service_role;

create or replace function public.reserve_generation(request_id uuid, owner_id text, user_limit integer, global_limit integer)
returns text language plpgsql security invoker set search_path = '' as $$
begin
  -- Serialize quota admission across all API replicas; no external calls inside lock.
  perform pg_advisory_xact_lock(73918264);
  if exists (select 1 from public.generation_requests where id = request_id) then
    return 'duplicate';
  end if;
  if (select count(*) from public.generation_requests where created_at >= now() - interval '24 hours') >= global_limit
    or (select count(*) from public.generation_requests where user_id = owner_id and created_at >= now() - interval '24 hours') >= user_limit
    or exists (select 1 from public.generation_requests where user_id = owner_id and active_until > now())
    or (select count(*) from public.generation_requests where active_until > now()) >= 3 then
    return 'limit';
  end if;
  insert into public.generation_requests (id, user_id) values (request_id, owner_id);
  delete from public.generation_requests where created_at < now() - interval '30 days';
  return 'ok';
end;
$$;
revoke all on function public.reserve_generation(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid, text, integer, integer) to service_role;
