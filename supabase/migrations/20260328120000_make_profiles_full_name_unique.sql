do $$
begin
  if exists (
    select full_name
    from public.profiles
    where full_name is not null
    group by full_name
    having count(*) > 1
  ) then
    raise exception 'Cannot add unique index on public.profiles(full_name): duplicate full_name values exist';
  end if;
end $$;

create unique index if not exists profiles_full_name_idx
on public.profiles (full_name)
where full_name is not null;
