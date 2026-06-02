drop function if exists public.get_listing_by_slug(text);
drop function if exists public.get_listing_by_id(uuid);
drop function if exists public.get_listings(uuid, uuid, text, public.type, text, integer, integer);

alter table public.listings drop column if exists type;

drop type if exists public.type;

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
    l.category_id,
    g.slug as category_slug,
    g.name as category_name,
    g.cover_url as category_cover_url,
    g.genres as category_genres,
    g.release_date as category_release_date,
    g.website as category_website,
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
    p.avatar_url,
    p.created_at;
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
  p_category_id uuid default null,
  p_user_id uuid default null,
  p_search text default null,
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
      l.category_id,
      g.slug as category_slug,
      g.name as category_name,
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
    join public.categories g on g.id = l.category_id
    join public.profiles p on p.id = l.user_id
    left join public.listing_likes ll on ll.listing_id = l.id
    where l.active = true
      and (p_category_id is null or l.category_id = p_category_id)
      and (p_user_id is null or l.user_id = p_user_id)
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
    category_id,
    category_slug,
    category_name,
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
grant execute on function public.get_listings(uuid, uuid, text, text, integer, integer) to anon, authenticated;
