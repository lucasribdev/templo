drop function if exists public.get_listing_by_id(uuid);

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
    l.updated_at,
    p.username as profile_username,
    p.full_name as profile_full_name,
    p.avatar_url as profile_avatar_url
  from public.listings l
  join public.games g on g.id = l.game_id
  join public.profiles p on p.id = l.user_id
  left join public.listing_likes ll on ll.listing_id = l.id
  where l.id = p_listing_id
  group by
    l.id,
    g.name,
    g.cover_url,
    g.genres,
    g.release_date,
    g.website,
    p.username,
    p.full_name,
    p.avatar_url;
$$;
