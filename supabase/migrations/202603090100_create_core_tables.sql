-- Core tables: games, profiles, listings
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'type'
      and n.nspname = 'public'
  ) then
    create type public.type as enum ('COMMUNITY', 'LFG', 'SERVER');
  end if;
end $$;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  rawg_id integer unique,
  source text not null default 'manual',
  slug text,
  name text not null,
  website text,
  cover_url text,
  genres text[],
  release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_name_idx on public.games using gin (to_tsvector('simple', name));
create index if not exists games_source_idx on public.games (source);
create index if not exists games_rawg_id_idx on public.games (rawg_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  discord_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete restrict,
  type public.type not null default 'LFG',
  title text not null,
  description text,
  ip text,
  tags text[],
  discord_invite text,
  views bigint not null default 0 check (views >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_user_id_idx on public.listings (user_id);
create index if not exists listings_game_id_idx on public.listings (game_id);
create index if not exists listings_active_idx on public.listings (active);
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_title_idx on public.listings using gin (to_tsvector('simple', title));
create index if not exists listings_views_idx on public.listings (views desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute procedure public.set_updated_at();
