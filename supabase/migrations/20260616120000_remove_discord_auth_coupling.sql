do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'discord_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'auth_provider_id'
  ) then
    alter table public.profiles rename column discord_id to auth_provider_id;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'auth_provider_id'
  ) then
    alter table public.profiles add column auth_provider_id text;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'auth_provider'
  ) then
    alter table public.profiles add column auth_provider text;
  end if;
end $$;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    username,
    auth_provider,
    auth_provider_id
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      new.email
    ),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.email
    ),
    new.raw_app_meta_data->>'provider',
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub')
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    username = coalesce(excluded.username, public.profiles.username),
    auth_provider = coalesce(excluded.auth_provider, public.profiles.auth_provider),
    auth_provider_id = coalesce(excluded.auth_provider_id, public.profiles.auth_provider_id),
    updated_at = now();

  return new;
end;
$$;
