-- 창작 흐름을 막던 일별 방류 3회 제한을 제거한다.
-- 구역 수용량과 신고/운영 검토 규칙은 그대로 유지한다.
create or replace function public.release_creature(
  p_kind text,
  p_name text,
  p_message text,
  p_sprite text,
  p_draft_id uuid default null
)
returns setof public.creatures
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_zone_id text;
  v_slot bigint;
  v_x integer;
  v_y integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_kind not in ('fish', 'seaweed', 'decoration') then raise exception 'invalid kind'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'name required'; end if;
  if char_length(trim(p_name)) > 12 then raise exception 'name too long'; end if;
  if char_length(coalesce(p_message, '')) > 30 then raise exception 'message too long'; end if;
  if nullif(p_sprite, '') is null then raise exception 'empty sprite'; end if;

  perform pg_advisory_xact_lock(hashtext('endless-aquarium:release'));

  select z.id into v_zone_id
  from public.zones z
  where z.accepting_releases
    and (select count(*) from public.creatures c where c.zone_id = z.id and c.status = 'published') < z.capacity
  order by random()
  limit 1;
  if v_zone_id is null then raise exception 'no release zone available' using errcode = 'P0001'; end if;

  if p_draft_id is not null then
    select slot into v_slot
    from public.creatures
    where id = p_draft_id and author_id = auth.uid() and status = 'draft'
    for update;
    if not found then raise exception 'draft not found' using errcode = 'P0002'; end if;
    select world_x, world_y into v_x, v_y from public.slot_to_point(v_slot, p_kind);

    return query
      update public.creatures set
        kind = p_kind,
        motion = public.motion_for_kind(p_kind),
        name = trim(p_name),
        message = trim(coalesce(p_message, '')),
        sprite = p_sprite,
        world_x = v_x,
        world_y = v_y,
        status = 'published',
        zone_id = v_zone_id,
        submitted_at = now(),
        published_at = now(),
        rejection_reason = null
      where id = p_draft_id
      returning *;
    return;
  end if;

  v_slot := nextval('public.creature_slot_seq');
  select world_x, world_y into v_x, v_y from public.slot_to_point(v_slot, p_kind);
  return query
    insert into public.creatures (
      kind, motion, name, message, status, author_id, author_nickname, zone_id,
      sprite, world_x, world_y, slot, submitted_at, published_at
    )
    select
      p_kind, public.motion_for_kind(p_kind), trim(p_name), trim(coalesce(p_message, '')),
      'published', auth.uid(), u.nickname, v_zone_id,
      p_sprite, v_x, v_y, v_slot, now(), now()
    from public.users u where u.id = auth.uid()
    returning *;
end;
$$;

revoke all on function public.release_creature(text, text, text, text, uuid) from public, anon;
grant execute on function public.release_creature(text, text, text, text, uuid) to authenticated;
