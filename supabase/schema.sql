-- Bowling Tracker: the cloud copy of what each device keeps locally.
-- Run this once in the Supabase dashboard (SQL Editor). It is safe to run again.
--
-- One row per record. A night is one row, with its games stored as JSON.
-- Every table has the same five bookkeeping columns:
--   user_id    who owns the row
--   id         the record's id, created on the device
--   updated_at when the record was last edited, on the device that edited it
--   deleted_at set when the record was deleted (rows are never removed, so a
--              delete on one device can reach the others)
--   synced_at  when the server last accepted a change to the row

create table if not exists public.profiles (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  pap_over double precision,
  pap_up double precision,
  usbc_number text,
  ball_weight integer,
  hand text,
  style text,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.ball_specs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text,
  brand text,
  rg double precision,
  differential double precision,
  mass_bias_diff double precision,
  coverstock text,
  core text,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.balls (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  spec_id text,
  nickname text,
  weight integer,
  layout jsonb,
  surface text,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.patterns (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text,
  kind text,
  length double precision,
  ratio double precision,
  volume double precision,
  notes text,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.sessions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  date timestamptz,
  type text,
  event_name text,
  pattern_id text,
  games jsonb,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.season_closes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  league_key text,
  closed_at timestamptz,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

-- The conflict rule, enforced by the database so no device can break it:
-- the newest edit wins. An update carrying an older edit time is dropped.
create or replace function public.keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null; -- skip this row's update; the newer copy stays
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

-- The same four rules for every table.
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'ball_specs', 'balls', 'patterns', 'sessions', 'season_closes']
  loop
    -- 1. Devices ask "what changed since I last looked?" by synced_at.
    execute format('create index if not exists %I on public.%I (user_id, synced_at)', t || '_synced_at_idx', t);

    -- 2. Stamp synced_at and apply the newest-wins rule on every write.
    execute format('drop trigger if exists keep_newest on public.%I', t);
    execute format('create trigger keep_newest before insert or update on public.%I for each row execute function public.keep_newest()', t);

    -- 3. Only signed-in users reach the table at all, and never to delete.
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);

    -- 4. Row-level security: you can only see and change your own rows.
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Read own rows" on public.%I', t);
    execute format('drop policy if exists "Add own rows" on public.%I', t);
    execute format('drop policy if exists "Change own rows" on public.%I', t);
    execute format('create policy "Read own rows" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Add own rows" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Change own rows" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;
