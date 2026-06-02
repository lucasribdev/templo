create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

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

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  rawg_id integer unique,
  source text not null default 'manual',
  slug text not null unique,
  name text not null,
  website text,
  cover_url text,
  genres text[],
  release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_name_idx on public.categories using gin (to_tsvector('simple', name));
create index if not exists categories_source_idx on public.categories (source);
create index if not exists categories_rawg_id_idx on public.categories (rawg_id);

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
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
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
create index if not exists listings_category_id_idx on public.listings (category_id);
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

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(unaccent(value), '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute procedure public.set_updated_at();

create or replace function public.set_category_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
begin
  base_slug := nullif(public.slugify(new.name), '');

  if base_slug is null then
    base_slug := 'category';
  end if;

  candidate_slug := base_slug;

  if tg_op = 'INSERT' or new.name is distinct from old.name or coalesce(trim(new.slug), '') = '' then
    while exists (
      select 1
      from public.categories g
      where g.slug = candidate_slug
        and g.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) loop
      suffix := suffix + 1;
      candidate_slug := base_slug || '-' || suffix::text;
    end loop;

    new.slug := candidate_slug;
  end if;

  return new;
end;
$$;

drop trigger if exists set_category_slug on public.categories;
create trigger set_category_slug
before insert or update of name, slug on public.categories
for each row
execute procedure public.set_category_slug();

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

create or replace function public.set_listing_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
begin
  base_slug := nullif(public.slugify(new.title), '');

  if base_slug is null then
    base_slug := 'listing';
  end if;

  candidate_slug := base_slug;

  if tg_op = 'INSERT' or new.title is distinct from old.title or coalesce(trim(new.slug), '') = '' then
    while exists (
      select 1
      from public.listings l
      where l.slug = candidate_slug
        and l.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) loop
      suffix := suffix + 1;
      candidate_slug := base_slug || '-' || suffix::text;
    end loop;

    new.slug := candidate_slug;
  end if;

  return new;
end;
$$;

drop trigger if exists set_listing_slug on public.listings;
create trigger set_listing_slug
before insert or update of title, slug on public.listings
for each row
execute procedure public.set_listing_slug();

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
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  category_cover_url text,
  category_genres text[],
  category_release_date date,
  category_website text,
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
  profile_username text,
  profile_full_name text,
  profile_avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    l.id,
    l.slug,
    l.user_id,
    l.category_id,
    g.slug as category_slug,
    g.name as category_name,
    g.cover_url as category_cover_url,
    g.genres as category_genres,
    g.release_date as category_release_date,
    g.website as category_website,
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
    p.username as profile_username,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url
  from public.listings l
  join public.categories g on g.id = l.category_id
  join public.profiles p on p.id = l.user_id
  left join public.listing_likes ll on ll.listing_id = l.id
  where l.id = p_listing_id
  group by
    l.id,
    l.slug,
    g.slug,
    g.name,
    g.cover_url,
    g.genres,
    g.release_date,
    g.website,
    p.username,
    p.full_name,
    p.avatar_url;
$$;

create or replace function public.get_listing_by_slug(p_listing_slug text)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  category_cover_url text,
  category_genres text[],
  category_release_date date,
  category_website text,
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
  profile_username text,
  profile_full_name text,
  profile_avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.get_listing_by_id(
    (
      select l.id
      from public.listings l
      where l.slug = p_listing_slug
      limit 1
    )
  );
$$;

create or replace function public.get_or_create_manual_category(
  p_name text,
  p_cover_url text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_slug text;
  existing_category_id uuid;
  created_category_id uuid;
begin
  normalized_slug := nullif(public.slugify(p_name), '');

  if normalized_slug is null then
    raise exception 'Invalid category name';
  end if;

  select g.id
  into existing_category_id
  from public.categories g
  where g.slug = normalized_slug
  limit 1;

  if existing_category_id is not null then
    return existing_category_id;
  end if;

  insert into public.categories (
    name,
    source,
    cover_url
  )
  values (
    p_name,
    'manual',
    p_cover_url
  )
  returning id into created_category_id;

  return created_category_id;
end;
$$;

create or replace function public.get_listings(
  p_category_id uuid default null,
  p_user_id uuid default null,
  p_search text default null,
  p_type public.type default null,
  p_sort_by text default 'DATE',
  p_limit int default 12,
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
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
  category_cover_url text,
  category_genres text[],
  category_release_date date,
  category_website text,
  profile_username text,
  profile_full_name text,
  profile_avatar_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  with listing_stats as (
    select
      l.id,
      l.slug,
      l.user_id,
      l.category_id,
      g.slug as category_slug,
      g.name as category_name,
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
      g.cover_url as category_cover_url,
      g.genres as category_genres,
      g.release_date as category_release_date,
      g.website as category_website,
      p.username as profile_username,
      p.full_name as profile_full_name,
      p.avatar_url as profile_avatar_url,
      (
        case
          when p_search is null then 0
          else
            (case when l.title ilike '%' || p_search || '%' then 3 else 0 end) +
            (case when g.name ilike '%' || p_search || '%' then 2 else 0 end) +
            (case when coalesce(l.description, '') ilike '%' || p_search || '%' then 1 else 0 end) +
            (
              case
                when exists (
                  select 1
                  from unnest(coalesce(l.tags, '{}')) as tag
                  where tag ilike '%' || p_search || '%'
                ) then 1
                else 0
              end
            )
        end
      )::int as relevance_score
    from public.listings l
    join public.categories g on g.id = l.category_id
    join public.profiles p on p.id = l.user_id
    left join public.listing_likes ll on ll.listing_id = l.id
    where l.active = true
      and (p_category_id is null or l.category_id = p_category_id)
      and (p_user_id is null or l.user_id = p_user_id)
      and (p_type is null or l.type = p_type)
      and (
        p_search is null
        or l.title ilike '%' || p_search || '%'
        or coalesce(l.description, '') ilike '%' || p_search || '%'
        or g.name ilike '%' || p_search || '%'
        or exists (
          select 1
          from unnest(coalesce(l.tags, '{}')) as tag
          where tag ilike '%' || p_search || '%'
        )
      )
    group by
      l.id,
      l.slug,
      g.slug,
      g.name,
      g.cover_url,
      g.genres,
      g.release_date,
      g.website,
      p.username,
      p.full_name,
      p.avatar_url
  )
  select
    id,
    slug,
    user_id,
    category_id,
    category_slug,
    category_name,
    type,
    title,
    description,
    ip,
    tags,
    discord_invite,
    views,
    active,
    likes_count,
    user_liked,
    created_at,
    updated_at,
    category_cover_url,
    category_genres,
    category_release_date,
    category_website,
    profile_username,
    profile_full_name,
    profile_avatar_url
  from listing_stats
  order by
    case when p_sort_by = 'POPULARITY' then views end desc,
    case when p_sort_by = 'RELEVANCE' then relevance_score end desc,
    created_at desc
  limit p_limit
  offset p_offset;
$$;

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_likes enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories
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
grant execute on function public.get_listing_by_slug(text) to anon, authenticated;
grant execute on function public.get_or_create_manual_category(text, text) to authenticated;
grant execute on function public.get_listings(uuid, uuid, text, public.type, text, integer, integer) to anon, authenticated;
