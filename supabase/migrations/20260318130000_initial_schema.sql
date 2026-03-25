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

create table if not exists public.listing_likes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create index if not exists listing_likes_listing_id_idx on public.listing_likes (listing_id);
create index if not exists listing_likes_user_id_idx on public.listing_likes (user_id);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.raw_user_meta_data->>'name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create or replace function public.increment_listing_views(p_listing_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_views bigint;
begin
  update public.listings
  set views = views + 1
  where id = p_listing_id
    and active = true
  returning views into updated_views;

  return coalesce(updated_views, 0);
end;
$$;

create or replace function public.toggle_listing_like(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1
    from public.listings
    where id = p_listing_id
      and active = true
  ) then
    raise exception 'Listing not found or inactive';
  end if;

  select exists (
    select 1
    from public.listing_likes
    where listing_id = p_listing_id
      and user_id = v_user_id
  )
  into v_exists;

  if v_exists then
    delete from public.listing_likes
    where listing_id = p_listing_id
      and user_id = v_user_id;

    return false;
  end if;

  insert into public.listing_likes (listing_id, user_id)
  values (p_listing_id, v_user_id);

  return true;
end;
$$;

create or replace function public.get_listing_by_id(p_listing_id uuid)
returns table (
  id uuid,
  user_id uuid,
  game_id uuid,
  game_name text,
  game_cover_url text,
  game_genres text[],
  game_release_date date,
  game_website text,
  type public.type,
  title text,
  description text,
  ip text,
  tags text[],
  discord_invite text,
  views bigint,
  active boolean,
  likes_count bigint,
  user_liked boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.user_id,
    l.game_id,
    g.name as game_name,
    g.cover_url as game_cover_url,
    g.genres as game_genres,
    g.release_date as game_release_date,
    g.website as game_website,
    l.type,
    l.title,
    l.description,
    l.ip,
    l.tags,
    l.discord_invite,
    l.views,
    l.active,
    count(ll.id)::bigint as likes_count,
    coalesce(bool_or(ll.user_id = auth.uid()), false) as user_liked,
    l.created_at,
    l.updated_at
  from public.listings l
  join public.games g on g.id = l.game_id
  left join public.listing_likes ll on ll.listing_id = l.id
  where l.id = p_listing_id
  group by l.id, g.name, g.cover_url, g.genres, g.release_date, g.website;
$$;

create or replace function public.get_listings(
  p_game_id uuid default null,
  p_user_id uuid default null
)
returns table (
  id uuid,
  user_id uuid,
  game_id uuid,
  game_name text,
  type public.type,
  title text,
  description text,
  ip text,
  tags text[],
  discord_invite text,
  views bigint,
  active boolean,
  likes_count bigint,
  user_liked boolean,
  created_at timestamptz,
  updated_at timestamptz,
  game_cover_url text,
  game_genres text[],
  game_release_date date,
  game_website text,
  profile_username text,
  profile_avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.user_id,
    l.game_id,
    g.name as game_name,
    l.type,
    l.title,
    l.description,
    l.ip,
    l.tags,
    l.discord_invite,
    l.views,
    l.active,
    count(ll.id)::bigint as likes_count,
    coalesce(bool_or(ll.user_id = auth.uid()), false) as user_liked,
    l.created_at,
    l.updated_at,
    g.cover_url as game_cover_url,
    g.genres as game_genres,
    g.release_date as game_release_date,
    g.website as game_website,
    p.username as profile_username,
    p.avatar_url as profile_avatar_url
  from public.listings l
  join public.games g on g.id = l.game_id
  join public.profiles p on p.id = l.user_id
  left join public.listing_likes ll on ll.listing_id = l.id
  where l.active = true
    and (p_game_id is null or l.game_id = p_game_id)
    and (p_user_id is null or l.user_id = p_user_id)
  group by
    l.id,
    g.name,
    g.cover_url,
    g.genres,
    g.release_date,
    g.website,
    p.username,
    p.avatar_url
  order by l.created_at desc;
$$;

alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_likes enable row level security;

drop policy if exists "Public can read games" on public.games;
create policy "Public can read games"
on public.games
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Public can read active listings" on public.listings;
drop policy if exists "Public can read listings" on public.listings;
create policy "Public can read listings"
on public.listings
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can create own listings" on public.listings;
create policy "Authenticated users can create own listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view all listing likes" on public.listing_likes;
create policy "Users can view all listing likes"
on public.listing_likes
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert their own likes" on public.listing_likes;
create policy "Users can insert their own likes"
on public.listing_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own likes" on public.listing_likes;
create policy "Users can delete their own likes"
on public.listing_likes
for delete
to authenticated
using (auth.uid() = user_id);

grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
grant execute on function public.toggle_listing_like(uuid) to authenticated;
grant execute on function public.get_listing_by_id(uuid) to anon, authenticated;
grant execute on function public.get_listings(uuid, uuid) to anon, authenticated;
