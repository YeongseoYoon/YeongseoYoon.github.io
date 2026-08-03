create or replace function public.update_my_profile(p_nickname text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nickname text := nullif(trim(p_nickname), '');
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_nickname is null or char_length(v_nickname) > 12 then
    raise exception 'nickname must be 1 to 12 characters';
  end if;

  update public.users set nickname = v_nickname where id = auth.uid();
  if not found then raise exception 'user not found' using errcode = 'P0002'; end if;
  update public.creatures set author_nickname = v_nickname where author_id = auth.uid();
end;
$$;

revoke all on function public.update_my_profile(text) from public, anon;
grant execute on function public.update_my_profile(text) to authenticated;
