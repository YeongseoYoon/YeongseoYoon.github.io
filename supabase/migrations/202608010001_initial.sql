create extension if not exists pgcrypto;

create sequence if not exists public.creature_slot_seq start with 0 minvalue 0;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  role text not null default 'creator' check (role in ('creator', 'admin')),
  strikes integer not null default 0 check (strikes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.identities (
  source text not null check (source in ('toss', 'device')),
  key_hash bytea not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (source, key_hash)
);

create table if not exists public.zones (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  "order" integer not null,
  capacity integer not null default 120 check (capacity > 0),
  accepting_releases boolean not null default true
);

create table if not exists public.creatures (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fish', 'seaweed', 'decoration')),
  motion text not null check (motion in ('swim', 'sway', 'float', 'still')),
  name text not null check (char_length(name) between 1 and 12),
  message text not null default '' check (char_length(message) <= 30),
  status text not null default 'published' check (status in ('draft', 'pending', 'published', 'hidden', 'deleted', 'rejected')),
  author_id uuid not null references public.users(id) on delete cascade,
  author_nickname text,
  zone_id text references public.zones(id),
  sprite text,
  sprite_key text,
  world_x integer not null,
  world_y integer not null,
  slot bigint not null unique default nextval('public.creature_slot_seq'),
  rejection_reason text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  creature_id uuid not null references public.creatures(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason text not null check (reason in ('harassment', 'hate_sexual', 'violence', 'privacy', 'copyright', 'spam', 'etc')),
  detail text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (creature_id, reporter_id)
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  creature_id uuid not null,
  action text not null check (action in ('approve', 'reject', 'hide', 'delete', 'restrict_user', 'temp_hide')),
  moderator text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists creatures_status_world_x_idx on public.creatures(status, world_x);
create index if not exists creatures_author_idx on public.creatures(author_id, created_at desc);
create index if not exists creatures_zone_idx on public.creatures(zone_id, status);
create index if not exists reports_unresolved_idx on public.reports(resolved, created_at);
create index if not exists moderation_logs_created_idx on public.moderation_logs(created_at desc);

insert into public.zones (id, name, subtitle, "order", capacity, accepting_releases) values
  ('zone-cove', '햇살 어귀', '물빛이 가장 밝은 얕은 바다', 1, 120, true),
  ('zone-coral', '얕은 산호 정원', '알록달록 열대어가 모이는 곳', 2, 150, true),
  ('zone-anemone', '말미잘 골목', '작은 물고기들의 숨바꼭질', 3, 120, true),
  ('zone-turtle', '거북이 쉼터', '느긋한 친구들이 쉬어 가는 자리', 4, 100, true)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  "order" = excluded."order";

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.claim_identity(
  p_source text,
  p_raw_key text,
  p_nickname text default null
)
returns public.users
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user public.users;
  v_hash bytea;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_source not in ('toss', 'device') or nullif(trim(p_raw_key), '') is null then
    raise exception 'invalid identity';
  end if;

  insert into public.users (id, nickname)
  values (auth.uid(), nullif(trim(p_nickname), ''))
  on conflict (id) do update set
    nickname = coalesce(public.users.nickname, excluded.nickname);

  v_hash := digest(p_source || ':' || p_raw_key, 'sha256');
  insert into public.identities (source, key_hash, user_id)
  values (p_source, v_hash, auth.uid())
  on conflict (source, key_hash) do update set
    last_seen_at = now()
  where public.identities.user_id = auth.uid();

  select * into v_user from public.users where id = auth.uid();
  return v_user;
end;
$$;

create or replace function public.slot_to_point(p_slot bigint, p_kind text)
returns table(world_x integer, world_y integer)
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_col bigint := p_slot / 5;
  v_row integer := mod(p_slot, 5);
  v_jitter_x double precision := abs(mod(hashtextextended(p_slot::text, 17), 1000000)) / 1000000.0;
  v_jitter_y double precision := abs(mod(hashtextextended(p_slot::text, 29), 1000000)) / 1000000.0;
begin
  world_x := round(120 + v_col * 260 + v_jitter_x * 143)::integer;
  if p_kind in ('seaweed', 'decoration') then
    world_y := 1350;
  else
    world_y := round(630 + (v_row / 5.0) * 640 + v_jitter_y * 128)::integer;
  end if;
  return next;
end;
$$;

create or replace function public.motion_for_kind(p_kind text)
returns text
language sql
immutable
as $$
  select case p_kind
    when 'fish' then 'swim'
    when 'seaweed' then 'sway'
    when 'decoration' then 'still'
    else null
  end;
$$;

create or replace function public.save_draft(
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
  v_slot bigint;
  v_x integer;
  v_y integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_kind not in ('fish', 'seaweed', 'decoration') then raise exception 'invalid kind'; end if;
  if char_length(coalesce(p_message, '')) > 30 then raise exception 'message too long'; end if;
  if nullif(p_sprite, '') is null then raise exception 'empty sprite'; end if;

  if p_draft_id is not null then
    return query
      update public.creatures set
        kind = p_kind,
        motion = public.motion_for_kind(p_kind),
        name = coalesce(nullif(trim(p_name), ''), '이름 없는 생물'),
        message = trim(coalesce(p_message, '')),
        sprite = p_sprite
      where id = p_draft_id and author_id = auth.uid() and status = 'draft'
      returning *;
    if not found then raise exception 'draft not found' using errcode = 'P0002'; end if;
    return;
  end if;

  v_slot := nextval('public.creature_slot_seq');
  select world_x, world_y into v_x, v_y from public.slot_to_point(v_slot, p_kind);
  return query
    insert into public.creatures (
      kind, motion, name, message, status, author_id, author_nickname,
      sprite, world_x, world_y, slot, submitted_at
    )
    select
      p_kind, public.motion_for_kind(p_kind), coalesce(nullif(trim(p_name), ''), '이름 없는 생물'),
      trim(coalesce(p_message, '')), 'draft', auth.uid(), u.nickname,
      p_sprite, v_x, v_y, v_slot, null
    from public.users u where u.id = auth.uid()
    returning *;
end;
$$;

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
  v_used integer;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_kind not in ('fish', 'seaweed', 'decoration') then raise exception 'invalid kind'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'name required'; end if;
  if char_length(trim(p_name)) > 12 then raise exception 'name too long'; end if;
  if char_length(coalesce(p_message, '')) > 30 then raise exception 'message too long'; end if;
  if nullif(p_sprite, '') is null then raise exception 'empty sprite'; end if;

  perform pg_advisory_xact_lock(hashtext('endless-aquarium:release'));
  select count(*) into v_used
  from public.creatures
  where author_id = auth.uid()
    and submitted_at >= date_trunc('day', now())
    and status in ('pending', 'published');
  if v_used >= 3 then raise exception 'daily release limit reached' using errcode = 'P0001'; end if;

  select z.id into v_zone_id
  from public.zones z
  where z.accepting_releases
    and (select count(*) from public.creatures c where c.zone_id = z.id and c.status = 'published') < z.capacity
  order by random()
  limit 1;
  if v_zone_id is null then raise exception 'no release zone available' using errcode = 'P0001'; end if;

  if p_draft_id is not null then
    return query
      update public.creatures set
        kind = p_kind,
        motion = public.motion_for_kind(p_kind),
        name = trim(p_name),
        message = trim(coalesce(p_message, '')),
        sprite = p_sprite,
        status = 'published',
        zone_id = v_zone_id,
        submitted_at = now(),
        published_at = now(),
        rejection_reason = null
      where id = p_draft_id and author_id = auth.uid() and status = 'draft'
      returning *;
    if not found then raise exception 'draft not found' using errcode = 'P0002'; end if;
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

create or replace function public.update_creature_message(p_creature_id uuid, p_message text)
returns setof public.creatures
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if char_length(coalesce(p_message, '')) > 30 then raise exception 'message too long'; end if;
  return query
    update public.creatures set message = trim(coalesce(p_message, ''))
    where id = p_creature_id and author_id = auth.uid() and status = 'published'
    returning *;
  if not found then raise exception 'creature not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.delete_creature(p_creature_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.creatures set status = 'deleted'
  where id = p_creature_id and author_id = auth.uid() and status <> 'deleted';
  if not found then raise exception 'creature not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.submit_report(
  p_creature_id uuid,
  p_reason text,
  p_detail text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_hidden boolean := false;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_reason not in ('harassment', 'hate_sexual', 'violence', 'privacy', 'copyright', 'spam', 'etc') then raise exception 'invalid reason'; end if;
  if p_reason = 'etc' and nullif(trim(p_detail), '') is null then raise exception 'detail required'; end if;
  if not exists (select 1 from public.creatures where id = p_creature_id and status = 'published') then
    raise exception 'creature not found' using errcode = 'P0002';
  end if;

  insert into public.reports (creature_id, reporter_id, reason, detail)
  values (p_creature_id, auth.uid(), p_reason, trim(coalesce(p_detail, '')));

  select count(*) into v_count from public.reports where creature_id = p_creature_id and not resolved;
  if v_count >= 3 then
    update public.creatures set status = 'hidden' where id = p_creature_id and status = 'published';
    if found then
      v_hidden := true;
      insert into public.moderation_logs (creature_id, action, moderator, reason)
      values (p_creature_id, 'temp_hide', '자동', '신고 ' || v_count || '회 누적, 확인 필요');
    end if;
  end if;
  return jsonb_build_object('auto_hidden', v_hidden);
exception
  when unique_violation then
    raise exception 'already reported' using errcode = '23505';
end;
$$;

create or replace function public.moderate_creature(
  p_creature_id uuid,
  p_action text,
  p_reason text,
  p_zone_id text default null
)
returns setof public.creatures
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_creature public.creatures;
  v_status text;
begin
  if not public.is_admin() then raise exception 'admin required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'reason required'; end if;
  select * into v_creature from public.creatures where id = p_creature_id for update;
  if not found then raise exception 'creature not found' using errcode = 'P0002'; end if;

  v_status := case p_action
    when 'approve' then 'published'
    when 'reject' then 'rejected'
    when 'hide' then 'hidden'
    when 'temp_hide' then 'hidden'
    when 'delete' then 'deleted'
    else null
  end;
  if v_status is null then raise exception 'invalid action'; end if;

  if p_action = 'approve' and p_zone_id is null then raise exception 'zone required'; end if;
  if p_action = 'approve' then
    if not exists (select 1 from public.zones where id = p_zone_id and accepting_releases) then
      raise exception 'invalid zone';
    end if;
  end if;

  return query
    update public.creatures set
      status = v_status,
      zone_id = case when p_action = 'approve' then p_zone_id else zone_id end,
      published_at = case when p_action = 'approve' then now() else published_at end,
      rejection_reason = case when p_action in ('reject', 'hide') then trim(p_reason) when p_action = 'approve' then null else rejection_reason end
    where id = p_creature_id
    returning *;

  if p_action in ('hide', 'reject') then
    update public.reports set resolved = true where creature_id = p_creature_id and not resolved;
    update public.users set strikes = strikes + 1 where id = v_creature.author_id;
  end if;
  insert into public.moderation_logs (creature_id, action, moderator, reason)
  values (p_creature_id, p_action, auth.uid()::text, trim(p_reason));
end;
$$;

alter table public.users enable row level security;
alter table public.identities enable row level security;
alter table public.zones enable row level security;
alter table public.creatures enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_logs enable row level security;

create policy users_read_self_or_admin on public.users for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy identities_read_self_or_admin on public.identities for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy zones_read_all on public.zones for select to anon, authenticated using (true);
create policy zones_admin_update on public.zones for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy creatures_read_visible on public.creatures for select to anon, authenticated
using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy reports_read_self_or_admin on public.reports for select to authenticated
using (reporter_id = auth.uid() or public.is_admin());
create policy moderation_logs_admin_read on public.moderation_logs for select to authenticated
using (public.is_admin());

revoke all on public.users, public.identities, public.zones, public.creatures, public.reports, public.moderation_logs from anon, authenticated;
grant select on public.zones, public.creatures to anon, authenticated;
grant select on public.users, public.identities, public.reports, public.moderation_logs to authenticated;
grant update on public.zones to authenticated;
grant usage, select on sequence public.creature_slot_seq to authenticated;
grant execute on function public.claim_identity(text, text, text) to authenticated;
grant execute on function public.save_draft(text, text, text, text, uuid) to authenticated;
grant execute on function public.release_creature(text, text, text, text, uuid) to authenticated;
grant execute on function public.update_creature_message(uuid, text) to authenticated;
grant execute on function public.delete_creature(uuid) to authenticated;
grant execute on function public.submit_report(uuid, text, text) to authenticated;
grant execute on function public.moderate_creature(uuid, text, text, text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.creatures;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.reports;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.moderation_logs;
exception when duplicate_object then null;
end $$;

