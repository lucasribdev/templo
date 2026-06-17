drop index if exists public.profiles_full_name_idx;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  display_name text;
  base_username text;
  candidate_username text;
  suffix integer := 1;
begin
  display_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    split_part(new.email, '@', 1),
    'usuario'
  )), '');

  if display_name is null then
    display_name := 'usuario';
  end if;

  base_username := nullif(public.slugify(coalesce(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    display_name
  )), '');

  if base_username is null then
    base_username := 'usuario';
  end if;

  candidate_username := base_username;

  loop
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
        display_name,
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        candidate_username,
        new.raw_app_meta_data->>'provider',
        coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub')
      )
      on conflict (id) do update
      set
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        username = coalesce(public.profiles.username, excluded.username),
        auth_provider = coalesce(excluded.auth_provider, public.profiles.auth_provider),
        auth_provider_id = coalesce(excluded.auth_provider_id, public.profiles.auth_provider_id),
        updated_at = now();

      return new;
    exception
      when unique_violation then
        suffix := suffix + 1;
        candidate_username := base_username || '-' || suffix::text;
    end;
  end loop;
end;
$$;
