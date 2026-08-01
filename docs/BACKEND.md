# 서버 설계 (Supabase + 통합 토큰)

> 목표: **웹과 앱인토스가 같은 바다를 공유**한다. 가입은 여전히 필요 없다.

## 1. 신원 — 서버 발급 통합 토큰

문제: 앱인토스는 `getAnonymousKey()`를 쓸 수 있지만 웹은 못 쓴다. 반대로 웹의 기기 id는 토스에서 의미가 없다.
해결: **양쪽 모두 서버에 "출처 + 원시 키"를 보내고, 서버가 공통 사용자 토큰을 발급**한다.

```
[앱인토스]  getAnonymousKey() → { source:'toss',   rawKey: <해시> }  ┐
                                                                     ├→ POST /auth/anon → { userId, accessToken }
[웹]        localStorage 기기 id → { source:'device', rawKey: <id> }  ┘
```

- 서버는 `(source, raw_key)` → `users.id`로 매핑한다(없으면 생성).
- 이후 모든 API는 `accessToken`만 쓴다 → **클라이언트 코드가 플랫폼을 몰라도 된다**.
- 같은 사람이 웹·토스를 각각 쓰면 지금은 별개 사용자다. 나중에 계정 연동(같은 토스 계정으로 웹 로그인)을 붙이면 병합할 수 있게 `identities` 테이블을 분리해 둔다.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  role text not null default 'creator',      -- creator | admin
  strikes int not null default 0,            -- 제재 이력: 서버에만 저장
  created_at timestamptz not null default now()
);

create table identities (                     -- 한 사용자에 여러 출처를 붙일 수 있게 분리
  source text not null,                       -- 'toss' | 'device'
  raw_key text not null,
  user_id uuid not null references users(id) on delete cascade,
  primary key (source, raw_key)
);
```

## 2. 스키마

스프라이트는 **팔레트+RLE 문자열 하나**라 컬럼 1개면 끝난다(36×32 실측 51자). 좌표는 방류 시 확정 후 불변.

```sql
create table zones (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  "order" int not null,
  capacity int not null default 120,
  accepting_releases boolean not null default true
);

create table creatures (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                         -- fish | seaweed | decoration
  motion text not null,
  name text not null,
  message text not null default '',
  status text not null default 'published',   -- draft|published|hidden|deleted|rejected
  author_id uuid not null references users(id) on delete cascade,
  author_nickname text,
  zone_id text references zones(id),
  sprite text,                                -- 팔레트+RLE. 프리셋이면 null
  sprite_key text,
  world_x int not null,                       -- 고정 좌표 (재배정 없음)
  world_y int not null,
  slot int not null unique,                   -- 좌표 배정 근거. 삭제해도 재사용 금지
  rejection_reason text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz
);
create index on creatures (status, world_x);  -- 뷰포트 조회용

create table reports (
  id uuid primary key default gen_random_uuid(),
  creature_id uuid not null references creatures(id) on delete cascade,
  reporter_id uuid not null references users(id) on delete cascade,
  reason text not null,
  detail text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (creature_id, reporter_id)           -- 중복 신고 차단을 DB가 보장
);

create table moderation_logs (
  id uuid primary key default gen_random_uuid(),
  creature_id uuid not null,
  action text not null,
  moderator text not null,
  reason text not null,
  created_at timestamptz not null default now()
);
```

### 좌표 배정은 원자적으로

동시에 방류하면 같은 슬롯을 받을 수 있다. **DB 시퀀스로 슬롯을 뽑고** 좌표는 서버에서 `slotToPoint`와 동일한 공식으로 계산한다.

```sql
create sequence creature_slot_seq;
-- 방류 시: select nextval('creature_slot_seq')
```

## 3. RLS (Row Level Security)

```sql
alter table creatures enable row level security;

-- 누구나 공개된 생물을 본다 (감상은 로그인 불필요)
create policy read_published on creatures
  for select using (status = 'published');

-- 내 작품은 상태와 무관하게 본다
create policy read_mine on creatures
  for select using (author_id = auth.uid());

-- 수정/삭제는 본인만
create policy write_mine on creatures
  for update using (author_id = auth.uid());
create policy delete_mine on creatures
  for delete using (author_id = auth.uid());
```

> ⚠️ **운영 권한은 반드시 서버에서 검증**한다. 지금 클라이언트 판별(`VITE_ADMIN_KEYS`)은 데모용이다.
> 실제로는 `users.role = 'admin'`을 RLS/Edge Function에서 확인해야 한다.
> 숨김·반려·제재는 클라이언트가 직접 못 하게 하고 **Edge Function 하나로 감싼다**(상태 전이 + 로그 + strikes를 한 트랜잭션으로).

## 4. 클라이언트 전환

지금 구조는 이미 준비돼 있다 — 모든 접근이 리포지토리 추상 뒤에 있다.

```
features/UI  →  creatureApi (인터페이스)  →  ┬ mockDb 구현   (현재)
                                             └ supabase 구현 (교체 대상)
```

바꿀 파일은 `entities/*/api/*Api.ts` **뿐**이고, 화면·피처 코드는 손대지 않는다.

```ts
// entities/creature/api/creatureApi.ts (교체 예시)
export const creatureApi: CreatureRepository = {
  listByStatus: async (status) => {
    const { data } = await supabase.from('creatures').select('*').eq('status', status);
    return (data ?? []).map(fromRow);
  },
  // …
};
```

`VITE_API_MODE=mock | supabase` 로 두 구현을 스위치하면 오프라인 데모도 유지된다.

## 5. 실시간

Supabase Realtime으로 `creatures` 테이블을 구독하면 **메시지 수정·신규 방류가 즉시 전파**된다.
(현재 목업은 "다시 볼 때 최신값"이라 진짜 실시간은 아니다 — 이 단계에서 해결된다.)

```ts
supabase.channel('sea')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'creatures' }, refetch)
  .subscribe();
```

헤엄 위치는 **여전히 전송하지 않는다**(클라이언트 연출) → 트래픽이 사람 수가 아니라 **작품 변경 수**에만 비례한다.

## 6. 직접 하셔야 하는 일

1. Supabase 프로젝트 생성 → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 발급
2. 위 스키마·RLS 적용 (SQL 편집기에 붙여넣기)
3. `/auth/anon` Edge Function 배포 (토큰 발급)
4. 앱인토스 콘솔에 앱 등록 → `granite.config.ts`의 `appName` 반영
