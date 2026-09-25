begin;
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.changelogs'::regclass) then raise exception 'RLS not enabled'; end if;
  if has_table_privilege('anon', 'public.changelogs', 'select') or has_table_privilege('authenticated', 'public.changelogs', 'insert') then raise exception 'Unexpected client grants'; end if;
  if has_function_privilege('anon', 'public.reserve_generation(uuid,text,integer,integer)', 'execute') then raise exception 'Public quota access'; end if;
end $$;
set local role service_role;
do $$
declare first_id uuid := gen_random_uuid(); second_id uuid := gen_random_uuid();
begin
  if public.reserve_generation(first_id, 'test-alice', 2, 3) <> 'ok' then raise exception 'First reservation failed'; end if;
  if public.reserve_generation(first_id, 'test-alice', 2, 3) <> 'duplicate' then raise exception 'Duplicate charged'; end if;
  if public.reserve_generation(second_id, 'test-alice', 2, 3) <> 'limit' then raise exception 'Concurrent request admitted'; end if;
  update public.generation_requests set active_until = now() where id = first_id;
  if public.reserve_generation(second_id, 'test-alice', 2, 3) <> 'ok' then raise exception 'Second reservation failed'; end if;
  update public.generation_requests set active_until = now() where id = second_id;
  if public.reserve_generation(gen_random_uuid(), 'test-alice', 2, 3) <> 'limit' then raise exception 'User quota bypass'; end if;
  if public.reserve_generation(gen_random_uuid(), 'test-bob', 2, 3) <> 'ok' then raise exception 'Other user blocked'; end if;
  if public.reserve_generation(gen_random_uuid(), 'test-carol', 2, 3) <> 'limit' then raise exception 'Global quota bypass'; end if;
  insert into public.changelogs (id, user_id, repo_name, content) values (first_id, 'test-alice', 'test/repo', 'draft') on conflict do nothing;
  insert into public.changelogs (id, user_id, repo_name, content) values (first_id, 'test-alice', 'test/repo', 'draft') on conflict do nothing;
  if (select count(*) from public.changelogs where id = first_id) <> 1 then raise exception 'Save retry duplicated'; end if;
end $$;
rollback;
