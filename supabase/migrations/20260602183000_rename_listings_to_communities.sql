-- Transition backend naming from listings to communities without deleting data.

do $$
begin
  if to_regclass('public.communities') is null and to_regclass('public.listings') is not null then
    alter table public.listings rename to communities;
  end if;

  if to_regclass('public.community_likes') is null and to_regclass('public.listing_likes') is not null then
    alter table public.listing_likes rename to community_likes;
  end if;

  if to_regclass('public.community_view_events') is null and to_regclass('public.listing_view_events') is not null then
    alter table public.listing_view_events rename to community_view_events;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_likes'
      and column_name = 'listing_id'
  ) then
    alter table public.community_likes rename column listing_id to community_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_view_events'
      and column_name = 'listing_id'
  ) then
    alter table public.community_view_events rename column listing_id to community_id;
  end if;
end;
$$;

alter index if exists listings_pkey rename to communities_pkey;
alter index if exists listings_slug_key rename to communities_slug_key;
alter index if exists listings_user_id_idx rename to communities_user_id_idx;
alter index if exists listings_category_id_idx rename to communities_category_id_idx;
alter index if exists listings_active_idx rename to communities_active_idx;
alter index if exists listings_created_at_idx rename to communities_created_at_idx;
alter index if exists listings_title_idx rename to communities_title_idx;
alter index if exists listings_views_idx rename to communities_views_idx;

alter index if exists listing_likes_pkey rename to community_likes_pkey;
alter index if exists listing_likes_listing_id_user_id_key rename to community_likes_community_id_user_id_key;
alter index if exists listing_likes_listing_id_idx rename to community_likes_community_id_idx;
alter index if exists listing_likes_user_id_idx rename to community_likes_user_id_idx;

alter index if exists listing_view_events_pkey rename to community_view_events_pkey;
alter index if exists listing_view_events_listing_id_created_at_idx rename to community_view_events_community_id_created_at_idx;
alter index if exists listing_view_events_viewer_id_idx rename to community_view_events_viewer_id_idx;
alter index if exists listing_view_events_visitor_id_idx rename to community_view_events_visitor_id_idx;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'listings_user_id_fkey') then
    alter table public.communities rename constraint listings_user_id_fkey to communities_user_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listings_category_id_fkey') then
    alter table public.communities rename constraint listings_category_id_fkey to communities_category_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listings_views_check') then
    alter table public.communities rename constraint listings_views_check to communities_views_check;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_likes_listing_id_fkey') then
    alter table public.community_likes rename constraint listing_likes_listing_id_fkey to community_likes_community_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_likes_user_id_fkey') then
    alter table public.community_likes rename constraint listing_likes_user_id_fkey to community_likes_user_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_likes_listing_id_user_id_key') then
    alter table public.community_likes rename constraint listing_likes_listing_id_user_id_key to community_likes_community_id_user_id_key;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_view_events_listing_id_fkey') then
    alter table public.community_view_events rename constraint listing_view_events_listing_id_fkey to community_view_events_community_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_view_events_viewer_id_fkey') then
    alter table public.community_view_events rename constraint listing_view_events_viewer_id_fkey to community_view_events_viewer_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'listing_view_events_identity_check') then
    alter table public.community_view_events rename constraint listing_view_events_identity_check to community_view_events_identity_check;
  end if;
end;
$$;

drop trigger if exists set_listings_updated_at on public.communities;
drop trigger if exists set_communities_updated_at on public.communities;
create trigger set_communities_updated_at
before update on public.communities
for each row
execute procedure public.set_updated_at();

create or replace function public.set_community_slug()
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
    base_slug := 'community';
  end if;

  candidate_slug := base_slug;

  if tg_op = 'INSERT' or new.title is distinct from old.title or coalesce(trim(new.slug), '') = '' then
    while exists (
      select 1
      from public.communities c
      where c.slug = candidate_slug
        and c.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) loop
      suffix := suffix + 1;
      candidate_slug := base_slug || '-' || suffix::text;
    end loop;

    new.slug := candidate_slug;
  end if;

  return new;
end;
$$;

drop trigger if exists set_listing_slug on public.communities;
drop trigger if exists set_community_slug on public.communities;
create trigger set_community_slug
before insert or update of title, slug on public.communities
for each row
execute procedure public.set_community_slug();

drop function if exists public.set_listing_slug();

create or replace function public.increment_community_views(p_community_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_views bigint;
begin
  update public.communities
  set views = views + 1
  where id = p_community_id
    and active = true
  returning views into updated_views;

  return coalesce(updated_views, 0);
end;
$$;

create or replace function public.toggle_community_like(p_community_id uuid)
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
    from public.communities
    where id = p_community_id
      and active = true
  ) then
    raise exception 'Community not found or inactive';
  end if;

  select exists (
    select 1
    from public.community_likes
    where community_id = p_community_id
      and user_id = v_user_id
  )
  into v_exists;

  if v_exists then
    delete from public.community_likes
    where community_id = p_community_id
      and user_id = v_user_id;

    return false;
  end if;

  insert into public.community_likes (community_id, user_id)
  values (p_community_id, v_user_id);

  return true;
end;
$$;

create or replace function public.track_community_view(
  p_community_id uuid,
  p_viewer_id uuid default null,
  p_visitor_id text default null,
  p_user_agent text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_visitor_id text := nullif(trim(coalesce(p_visitor_id, '')), '');
  normalized_user_agent text := nullif(trim(coalesce(p_user_agent, '')), '');
  updated_views bigint;
  already_counted boolean;
begin
  if p_viewer_id is null and normalized_visitor_id is null then
    return coalesce((select views from public.communities where id = p_community_id), 0);
  end if;

  select exists (
    select 1
    from public.community_view_events cve
    where cve.community_id = p_community_id
      and cve.created_at >= now() - interval '24 hours'
      and (
        (p_viewer_id is not null and cve.viewer_id = p_viewer_id)
        or (
          p_viewer_id is null
          and normalized_visitor_id is not null
          and cve.viewer_id is null
          and cve.visitor_id = normalized_visitor_id
        )
      )
  ) into already_counted;

  if not already_counted then
    insert into public.community_view_events (
      community_id,
      viewer_id,
      visitor_id,
      user_agent
    ) values (
      p_community_id,
      p_viewer_id,
      normalized_visitor_id,
      normalized_user_agent
    );

    update public.communities
    set views = views + 1
    where id = p_community_id
      and active = true
    returning views into updated_views;

    return coalesce(updated_views, 0);
  end if;

  return coalesce((select views from public.communities where id = p_community_id), 0);
end;
$$;

create or replace function public.get_community_by_id(p_community_id uuid)
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
    c.id,
    c.slug,
    c.user_id,
    c.category_id,
    g.slug as category_slug,
    g.name as category_name,
    g.cover_url as category_cover_url,
    g.genres as category_genres,
    g.release_date as category_release_date,
    g.website as category_website,
    c.title,
    c.description,
    c.ip,
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
  join public.categories g on g.id = c.category_id
  join public.profiles p on p.id = c.user_id
  left join public.community_likes cl on cl.community_id = c.id
  where c.id = p_community_id
  group by
    c.id,
    c.slug,
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

create or replace function public.get_community_by_slug(p_community_slug text)
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
  with community_stats as (
    select
      c.id,
      c.slug,
      c.user_id,
      c.category_id,
      g.slug as category_slug,
      g.name as category_name,
      c.title,
      c.description,
      c.ip,
      c.tags,
      c.discord_invite,
      c.views,
      c.active,
      count(cl.id)::bigint as likes_count,
      coalesce(bool_or(cl.user_id = auth.uid()), false) as user_liked,
      c.created_at,
      c.updated_at,
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
            (case when c.title ilike '%' || p_search || '%' then 3 else 0 end) +
            (case when g.name ilike '%' || p_search || '%' then 2 else 0 end) +
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
    join public.categories g on g.id = c.category_id
    join public.profiles p on p.id = c.user_id
    left join public.community_likes cl on cl.community_id = c.id
    where c.active = true
      and (p_category_id is null or c.category_id = p_category_id)
      and (p_user_id is null or c.user_id = p_user_id)
      and (
        p_search is null
        or c.title ilike '%' || p_search || '%'
        or coalesce(c.description, '') ilike '%' || p_search || '%'
        or g.name ilike '%' || p_search || '%'
        or exists (
          select 1
          from unnest(coalesce(c.tags, '{}')) as tag
          where tag ilike '%' || p_search || '%'
        )
      )
    group by
      c.id,
      c.slug,
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
  from community_stats
  order by
    case when p_sort_by = 'POPULARITY' then views end desc,
    case when p_sort_by = 'RELEVANCE' then relevance_score end desc,
    created_at desc
  limit p_limit
  offset p_offset;
$$;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'communities'
      and policyname = 'Public can read listings'
  ) then
    alter policy "Public can read listings" on public.communities rename to "Public can read communities";
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'communities'
      and policyname = 'Authenticated users can create own listings'
  ) then
    alter policy "Authenticated users can create own listings" on public.communities rename to "Authenticated users can create own communities";
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'communities'
      and policyname = 'Users can update own listings'
  ) then
    alter policy "Users can update own listings" on public.communities rename to "Users can update own communities";
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_likes'
      and policyname = 'Users can view all listing likes'
  ) then
    alter policy "Users can view all listing likes" on public.community_likes rename to "Users can view all community likes";
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_likes'
      and policyname = 'Users can insert their own likes'
  ) then
    alter policy "Users can insert their own likes" on public.community_likes rename to "Users can insert their own community likes";
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_likes'
      and policyname = 'Users can delete their own likes'
  ) then
    alter policy "Users can delete their own likes" on public.community_likes rename to "Users can delete their own community likes";
  end if;
end;
$$;

grant execute on function public.increment_community_views(uuid) to anon, authenticated;
grant execute on function public.toggle_community_like(uuid) to authenticated;
grant execute on function public.track_community_view(uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.get_community_by_id(uuid) to anon, authenticated;
grant execute on function public.get_community_by_slug(text) to anon, authenticated;
grant execute on function public.get_communities(uuid, uuid, text, text, integer, integer) to anon, authenticated;
