drop function if exists public.get_community_by_slug(text);
drop function if exists public.get_communities(uuid, uuid, text, text, integer, integer);
drop function if exists public.get_community_by_id(uuid);

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

  select c.id
  into existing_category_id
  from public.categories c
  where c.slug = normalized_slug
  limit 1;

  if existing_category_id is not null then
    return existing_category_id;
  end if;

  insert into public.categories (
    name,
    source
  )
  values (
    p_name,
    'manual'
  )
  returning id into created_category_id;

  return created_category_id;
end;
$$;

alter table public.categories
drop column if exists cover_url;

create or replace function public.get_community_by_id(p_community_id uuid)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  category_genres text[],
  category_release_date date,
  category_website text,
  title text,
  description text,
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
    c.id,
    c.slug,
    c.user_id,
    c.category_id,
    ct.slug as category_slug,
    ct.name as category_name,
    ct.genres as category_genres,
    ct.release_date as category_release_date,
    ct.website as category_website,
    c.title,
    c.description,
    c.tags,
    c.discord_invite,
    c.views,
    c.active,
    count(cl.id)::bigint as likes_count,
    coalesce(bool_or(cl.user_id = auth.uid()), false) as user_liked,
    c.created_at,
    c.updated_at,
    p.username as profile_username,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url,
    p.created_at as profile_created_at
  from public.communities c
  join public.categories ct on ct.id = c.category_id
  join public.profiles p on p.id = c.user_id
  left join public.community_likes cl on cl.community_id = c.id
  where c.id = p_community_id
  group by
    c.id,
    c.slug,
    ct.slug,
    ct.name,
    ct.genres,
    ct.release_date,
    ct.website,
    p.username,
    p.full_name,
    p.avatar_url,
    p.created_at;
$$;

create or replace function public.get_community_by_slug(p_community_slug text)
returns table (
  id uuid,
  slug text,
  user_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  category_genres text[],
  category_release_date date,
  category_website text,
  title text,
  description text,
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
  discord_invite text,
  views bigint,
  active boolean,
  likes_count bigint,
  user_liked boolean,
  created_at timestamptz,
  updated_at timestamptz,
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
      c.discord_invite,
      c.views,
      c.active,
      count(cl.id)::bigint as likes_count,
      coalesce(bool_or(cl.user_id = auth.uid()), false) as user_liked,
      c.created_at,
      c.updated_at,
      ct.genres as category_genres,
      ct.release_date as category_release_date,
      ct.website as category_website,
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
    left join public.community_likes cl on cl.community_id = c.id
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
    group by
      c.id,
      c.slug,
      ct.slug,
      ct.name,
      ct.genres,
      ct.release_date,
      ct.website,
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
    tags,
    discord_invite,
    views,
    active,
    likes_count,
    user_liked,
    created_at,
    updated_at,
    category_genres,
    category_release_date,
    category_website,
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
