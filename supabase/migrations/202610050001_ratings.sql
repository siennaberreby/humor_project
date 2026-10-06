begin;
-- All application tables use RLS, including the original movie collection.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;
-- Movies are public, read-only catalogue data.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='movies' loop
    execute format('drop policy %I on public.movies', p.policyname);
  end loop;
end $$;
revoke all on public.movies from anon, authenticated;
grant select on public.movies to anon, authenticated;
create policy "Public movie catalogue" on public.movies for select to anon, authenticated using (true);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 10 and 400),
  system_prompt text not null,
  caption text not null check (char_length(caption) between 1 and 600),
  model text not null,
  created_at timestamptz not null default now()
);
create table public.votes (
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  primary key (generation_id, user_id)
);
create table public.generation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.generations(created_at desc);
create index on public.votes(user_id);
create index on public.generation_attempts(user_id,created_at);
alter table public.generations enable row level security;
alter table public.votes enable row level security;
alter table public.generation_attempts enable row level security;
revoke all on public.generations, public.votes, public.generation_attempts from anon, authenticated;
-- Only the trusted generation endpoint can publish verified AI output.
grant select(id, prompt, caption, model, created_at) on public.generations to anon, authenticated;
grant all on public.generations, public.votes, public.generation_attempts to service_role;
create policy "Read published captions" on public.generations for select to anon, authenticated using (true);
grant select, insert on public.votes to authenticated;
grant update(value) on public.votes to authenticated;
create policy "Read own votes" on public.votes for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own votes" on public.votes for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Change own vote" on public.votes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Aggregate only: no voter identities are exposed by this function.
create function public.caption_scores(ids uuid[]) returns table(generation_id uuid, score bigint, vote_count bigint)
language sql stable security definer set search_path='' as $$
 select v.generation_id, sum(v.value)::bigint, count(*) from public.votes v
 where v.generation_id = any(ids[1:100]) group by v.generation_id;
$$;
revoke all on function public.caption_scores(uuid[]) from public;
grant execute on function public.caption_scores(uuid[]) to anon, authenticated;
-- Serialize quota reservations per account; parallel requests cannot bypass limits.
create function public.reserve_generation(target_user uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(target_user::text,0));
 if (select count(*) from public.generation_attempts where user_id=target_user and created_at > now()-interval '24 hours') >= 10
 or exists(select 1 from public.generation_attempts where user_id=target_user and created_at > now()-interval '30 seconds') then return false; end if;
 insert into public.generation_attempts(user_id) values(target_user);
 return true;
end $$;
revoke all on function public.reserve_generation(uuid) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid) to service_role;
commit;
