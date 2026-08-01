-- 운영자가 여러 기기에서 같은 비밀 코드를 사용해 각 익명 세션을 승인할 수 있게 한다.
-- 비밀 원문은 저장하지 않고 bcrypt 해시만 보관한다.
create table if not exists public.admin_access_secrets (
  singleton boolean primary key default true check (singleton),
  secret_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_access_secrets enable row level security;
revoke all on table public.admin_access_secrets from public, anon, authenticated;

alter table public.users
  add column if not exists admin_failed_attempts integer not null default 0 check (admin_failed_attempts >= 0),
  add column if not exists admin_locked_until timestamptz;

create or replace function public.claim_admin_access(p_code text)
returns table (
  ok boolean,
  error_code text,
  id uuid,
  nickname text,
  role text,
  strikes integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user public.users;
  v_hash text;
  v_failures integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_user from public.users where public.users.id = auth.uid() for update;
  if not found then
    raise exception 'identity must be claimed first' using errcode = '42501';
  end if;

  if v_user.role = 'admin' then
    return query select true, null::text, v_user.id, v_user.nickname, v_user.role, v_user.strikes, v_user.created_at;
    return;
  end if;

  if v_user.admin_locked_until is not null and v_user.admin_locked_until > now() then
    return query select false, 'locked'::text, v_user.id, v_user.nickname, v_user.role, v_user.strikes, v_user.created_at;
    return;
  end if;

  select secret_hash into v_hash from public.admin_access_secrets where singleton = true;
  if v_hash is null then
    return query select false, 'not_configured'::text, v_user.id, v_user.nickname, v_user.role, v_user.strikes, v_user.created_at;
    return;
  end if;

  if nullif(trim(p_code), '') is not null and crypt(trim(p_code), v_hash) = v_hash then
    update public.users set
      role = 'admin',
      admin_failed_attempts = 0,
      admin_locked_until = null
    where public.users.id = auth.uid()
    returning * into v_user;
    return query select true, null::text, v_user.id, v_user.nickname, v_user.role, v_user.strikes, v_user.created_at;
    return;
  end if;

  v_failures := v_user.admin_failed_attempts + 1;
  update public.users set
    admin_failed_attempts = case when v_failures >= 5 then 0 else v_failures end,
    admin_locked_until = case when v_failures >= 5 then now() + interval '15 minutes' else null end
  where public.users.id = auth.uid()
  returning * into v_user;

  return query select
    false,
    case when v_failures >= 5 then 'locked' else 'invalid' end::text,
    v_user.id,
    v_user.nickname,
    v_user.role,
    v_user.strikes,
    v_user.created_at;
end;
$$;

revoke all on function public.claim_admin_access(text) from public, anon;
grant execute on function public.claim_admin_access(text) to authenticated;
