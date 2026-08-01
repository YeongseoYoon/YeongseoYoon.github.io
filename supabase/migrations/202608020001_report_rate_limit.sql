-- 한 계정이 운영 큐를 신고로 도배하지 못하도록 서버에서 일일 상한을 강제한다.
create index if not exists reports_reporter_created_idx
  on public.reports(reporter_id, created_at desc);

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
  -- 같은 사용자의 동시 요청도 상한을 넘지 못하도록 트랜잭션 단위 직렬화.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if (select count(*) from public.reports where reporter_id = auth.uid() and created_at >= current_date) >= 10 then
    raise exception 'daily report limit exceeded' using errcode = 'P0001';
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

grant execute on function public.submit_report(uuid, text, text) to authenticated;
