drop function if exists public.get_community_by_slug(text);
drop function if exists public.get_community_by_id(uuid);
drop function if exists public.get_communities(uuid, uuid, text, text, integer, integer);

alter table public.categories
drop column if exists genres,
drop column if exists release_date,
drop column if exists website;

create or replace function public.get_community_by_id(p_community_id uuid)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  title text,
  description text,
  tags text[],
  links jsonb,
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
    c.id,
    c.slug,
    c.user_id,
    c.category_id,
    ct.slug as category_slug,
    ct.name as category_name,
    c.title,
    c.description,
    c.tags,
    coalesce(community_links.links, '[]'::jsonb) as links,
    c.views,
    c.active,
    coalesce(community_likes.likes_count, 0)::bigint as likes_count,
    coalesce(community_likes.user_liked, false) as user_liked,
    c.created_at,
    c.updated_at,
    p.username as profile_username,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url,
    p.created_at as profile_created_at
  from public.communities c
  join public.categories ct on ct.id = c.category_id
  join public.profiles p on p.id = c.user_id
  left join lateral (
    select
      count(cl.id)::bigint as likes_count,
      coalesce(bool_or(cl.user_id = auth.uid()), false) as user_liked
    from public.community_likes cl
    where cl.community_id = c.id
  ) community_likes on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'community_id', l.community_id,
        'platform', l.platform,
        'url', l.url,
        'position', l.position,
        'clicks_count', l.clicks_count,
        'label', l.label,
        'created_at', l.created_at,
        'updated_at', l.updated_at
      )
      order by l.position asc, l.created_at asc
    ) as links
    from public.community_links l
    where l.community_id = c.id
  ) community_links on true
  where c.id = p_community_id;
$$;

create or replace function public.get_community_by_slug(p_community_slug text)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  title text,
  description text,
  tags text[],
  links jsonb,
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
  from public.get_community_by_id(
    (
      select c.id
      from public.communities c
      where c.slug = p_community_slug
      limit 1
    )
  );
$$;

create or replace function public.get_communities(
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
  tags text[],
  links jsonb,
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
  with community_stats as (
    select
      c.id,
      c.slug,
      c.user_id,
      c.category_id,
      ct.slug as category_slug,
      ct.name as category_name,
      c.title,
      c.description,
      c.tags,
      coalesce(community_links.links, '[]'::jsonb) as links,
      c.views,
      c.active,
      coalesce(community_likes.likes_count, 0)::bigint as likes_count,
      coalesce(community_likes.user_liked, false) as user_liked,
      c.created_at,
      c.updated_at,
      p.username as profile_username,
      p.full_name as profile_full_name,
      p.avatar_url as profile_avatar_url,
      p.created_at as profile_created_at,
      (
        case
          when p_search is null then 0
          else
            (case when c.title ilike '%' || p_search || '%' then 3 else 0 end) +
            (case when ct.name ilike '%' || p_search || '%' then 2 else 0 end) +
            (case when coalesce(c.description, '') ilike '%' || p_search || '%' then 1 else 0 end) +
            (
              case
                when exists (
                  select 1
                  from unnest(coalesce(c.tags, '{}')) as tag
                  where tag ilike '%' || p_search || '%'
                ) then 1
                else 0
              end
            )
        end
      )::int as relevance_score
    from public.communities c
    join public.categories ct on ct.id = c.category_id
    join public.profiles p on p.id = c.user_id
    left join lateral (
      select
        count(cl.id)::bigint as likes_count,
        coalesce(bool_or(cl.user_id = auth.uid()), false) as user_liked
      from public.community_likes cl
      where cl.community_id = c.id
    ) community_likes on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'community_id', l.community_id,
          'platform', l.platform,
          'url', l.url,
          'position', l.position,
          'clicks_count', l.clicks_count,
          'label', l.label,
          'created_at', l.created_at,
          'updated_at', l.updated_at
        )
        order by l.position asc, l.created_at asc
      ) as links
      from public.community_links l
      where l.community_id = c.id
    ) community_links on true
    where c.active = true
      and (p_category_id is null or c.category_id = p_category_id)
      and (p_user_id is null or c.user_id = p_user_id)
      and (
        p_search is null
        or c.title ilike '%' || p_search || '%'
        or coalesce(c.description, '') ilike '%' || p_search || '%'
        or ct.name ilike '%' || p_search || '%'
        or exists (
          select 1
          from unnest(coalesce(c.tags, '{}')) as tag
          where tag ilike '%' || p_search || '%'
        )
      )
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
    tags,
    links,
    views,
    active,
    likes_count,
    user_liked,
    created_at,
    updated_at,
    profile_username,
    profile_full_name,
    profile_avatar_url,
    profile_created_at
  from community_stats
  order by
    case when p_sort_by = 'POPULARITY' then views end desc,
    case when p_sort_by = 'RELEVANCE' then relevance_score end desc,
    created_at desc
  limit p_limit
  offset p_offset;
$$;

grant execute on function public.get_community_by_id(uuid) to anon, authenticated;
grant execute on function public.get_community_by_slug(text) to anon, authenticated;
grant execute on function public.get_communities(uuid, uuid, text, text, integer, integer) to anon, authenticated;
