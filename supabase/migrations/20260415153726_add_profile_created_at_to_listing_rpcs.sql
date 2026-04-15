drop function if exists public.get_listing_by_slug(text);
drop function if exists public.get_listing_by_id(uuid);
drop function if exists public.get_listings(uuid, uuid, text, public.type, text, integer, integer);

create or replace function public.get_listing_by_id(p_listing_id uuid)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  game_id uuid,
  game_slug text,
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
  updated_at timestamptz,
  profile_username text,
  profile_full_name text,
  profile_avatar_url text,
  profile_created_at timestamptz
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
    l.game_id,
    g.slug as game_slug,
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
    l.updated_at,
    p.username as profile_username,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url,
    p.created_at as profile_created_at
  from public.listings l
  join public.games g on g.id = l.game_id
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
    p.avatar_url,
    p.created_at;
$$;

create or replace function public.get_listing_by_slug(p_listing_slug text)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  game_id uuid,
  game_slug text,
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
  updated_at timestamptz,
  profile_username text,
  profile_full_name text,
  profile_avatar_url text,
  profile_created_at timestamptz
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

create or replace function public.get_listings(
  p_game_id uuid default null,
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
  game_id uuid,
  game_slug text,
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
  profile_full_name text,
  profile_avatar_url text,
  profile_created_at timestamptz
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
      l.game_id,
      g.slug as game_slug,
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
      p.full_name as profile_full_name,
      p.avatar_url as profile_avatar_url,
      p.created_at as profile_created_at,
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
    join public.games g on g.id = l.game_id
    join public.profiles p on p.id = l.user_id
    left join public.listing_likes ll on ll.listing_id = l.id
    where l.active = true
      and (p_game_id is null or l.game_id = p_game_id)
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
      p.avatar_url,
      p.created_at
  )
  select
    id,
    slug,
    user_id,
    game_id,
    game_slug,
    game_name,
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
    game_cover_url,
    game_genres,
    game_release_date,
    game_website,
    profile_username,
    profile_full_name,
    profile_avatar_url,
    profile_created_at
  from listing_stats
  order by
    case when p_sort_by = 'POPULARITY' then views end desc,
    case when p_sort_by = 'RELEVANCE' then relevance_score end desc,
    created_at desc
  limit p_limit
  offset p_offset;
$$;

grant execute on function public.get_listing_by_id(uuid) to anon, authenticated;
grant execute on function public.get_listing_by_slug(text) to anon, authenticated;
grant execute on function public.get_listings(uuid, uuid, text, public.type, text, integer, integer) to anon, authenticated;
