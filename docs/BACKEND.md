# Supabase 공유 서버

웹과 앱인토스가 같은 바다를 공유하는 2단계 서버 구현이다. 별도 유료 서버나 Edge Function 없이 Supabase Free의 Postgres, Auth, Realtime만 사용한다.

## 구성

- **Auth**: Supabase anonymous sign-in. 앱인토스의 `getAnonymousKey()` 또는 웹 기기 id를 익명 세션과 연결한다.
- **Identity**: 원시 플랫폼 키는 저장하지 않고 `source + rawKey`의 SHA-256 해시만 `identities`에 저장한다.
- **Database**: `users`, `identities`, `zones`, `creatures`, `reports`, `moderation_logs`, `admin_access_secrets`.
- **RLS**: 공개 작품은 모두 읽고, 비공개 작품·신고·사용자는 본인 또는 운영자만 읽는다.
- **Writes**: 방류, 임시저장, 수정, 삭제, 신고, 운영 조치는 모두 서버 RPC를 통한다. 사용자 id·권한·일일 한도·구역 수용량을 DB에서 다시 검사한다.
- **Realtime**: `creatures`, `zones`, `reports`, `moderation_logs` 변경을 구독해 탐험·내 수조·운영 콘솔을 갱신한다. 헤엄 애니메이션 좌표는 전송하지 않는다.

## 적용 순서

Supabase Dashboard에서 프로젝트를 만든 뒤 Authentication의 Anonymous Sign-Ins를 켠다. SQL Editor에서 아래 파일을 이름 순서대로 실행한다.

1. `supabase/migrations/202608010001_initial.sql`
2. `supabase/migrations/202608010002_function_permissions.sql`
3. `supabase/migrations/202608010003_release_quota.sql`
4. `supabase/migrations/202608010004_admin_access.sql`
5. `supabase/migrations/202608010005_pretty_sample_creatures.sql` (기존 샘플 데이터가 있을 때)

`.env.example`을 `.env.local`로 복사하고 다음 값을 채운다.

```dotenv
VITE_API_MODE="supabase"
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
```

`service_role` 키나 데이터베이스 비밀번호는 클라이언트 환경 변수에 넣지 않는다. `.env.local`은 Git에서 제외된다.

## 가입 없는 사용자 구분

- 일반 웹에서는 브라우저 저장소의 무작위 기기 ID와 Supabase 익명 세션을 연결한다. 같은 브라우저 프로필에서는 같은 사용자지만, 다른 기기·브라우저·시크릿 창은 각각 새 사용자다. 사이트 데이터를 지워도 새 사용자로 인식된다.
- 앱인토스에서는 `getAnonymousKey()`의 해시를 사용한다. 원본 키는 서버에 저장하지 않는다.
- 공개 생물 감상에는 별도 회원가입이나 개인정보 입력이 필요 없다.

## 여러 기기의 운영자 지정

004 마이그레이션 적용 후, SQL Editor에서 강한 운영자 코드의 bcrypt 해시를 한 번 등록한다. 아래 `<새 운영자 코드>`는 저장소나 프론트엔드 환경 변수에 넣지 않는다.

```sql
insert into public.admin_access_secrets (singleton, secret_hash)
values (true, crypt('<새 운영자 코드>', gen_salt('bf', 12)))
on conflict (singleton) do update set
  secret_hash = excluded.secret_hash,
  updated_at = now();
```

각 기기에서 `/admin`을 열고 같은 코드를 한 번 입력하면, 서버가 현재 익명 세션의 `users.role`을 `admin`으로 승격한다. 코드 원문은 서버에도 저장되지 않으며 테이블은 클라이언트에서 읽을 수 없다. 한 세션에서 5회 실패하면 15분 동안 해당 세션의 입력을 막는다. 코드를 바꾸려면 위 SQL을 새 코드로 다시 실행한다.

기존 UUID를 직접 지정하는 방식도 비상 복구용으로 쓸 수 있다.

```sql
update public.users
set role = 'admin'
where id = '<사용자 UUID>';
```

실제 숨김·반려·삭제 권한은 화면 표시가 아니라 `is_admin()`과 `moderate_creature()`가 서버에서 검증한다.

## 검증

```bash
npm run lint
npm test
npm run build
npm run test:supabase
```

통합 테스트는 실제 무료 프로젝트에서 익명 인증, 신원 생성, 구역 읽기, 임시저장, 트랜잭션 방류, 소유자 수정, 운영자 권한 거부, 잘못된 운영자 코드 거부, 소프트 삭제, 삭제 후 일일 한도 유지를 검사한다. `SUPABASE_ADMIN_ACCESS_CODE`를 실행 환경에만 전달하면 정상 코드 승인도 추가로 검사한다. 실행할 때마다 익명 테스트 사용자와 삭제 상태 작품 한 건이 남을 수 있다.

브라우저 E2E에서는 두 탭을 열어 한쪽의 방류·삭제가 다른 쪽에 새로고침 없이 반영되는지 확인한다.

## 무료 플랜 운용

현재 프로젝트는 Supabase Free 조직에 생성되어 결제가 발생하지 않는다. 무료 한도를 넘기기 전에 사용량 알림을 확인하고, 장기간 미사용 시 프로젝트가 일시 중지될 수 있다는 점을 감안한다. 트래픽이 늘면 우선 Realtime 구독 범위와 조회량을 줄이는 방향으로 최적화하고, 유료 전환은 별도 결정으로 남긴다.

Anonymous Sign-Ins는 공개 앱에서 자동화 공격 대상이 될 수 있다. MVP 이후에는 CAPTCHA와 요청 속도 제한을 추가하는 것을 권장한다.
