import { getDeviceId } from '@/shared/lib';
import { ADMIN_ACCESS_KEY } from '@/shared/config';
import { getSupabaseClient, isSupabaseMode, rpcOne } from '@/shared/api';
import type { UserRole } from '@/entities/user';

/**
 * 신원 확인 (PRD 10). 가입 없이 사용자를 식별한다.
 *
 * - 토스(앱인토스) 환경: `getAnonymousKey()`의 해시를 신원으로 사용한다.
 *   → 백엔드 없이 사용자별 식별이 가능하다.
 * - 일반 웹(로컬 개발): localStorage 기기 id로 대체한다.
 *
 * 실제 프로필(닉네임 등)이 필요하면 appLogin() + 서버 토큰 교환으로 확장한다.
 */
export interface Identity {
  id: string;
  nickname: string | null;
  source: 'toss' | 'device';
  role: UserRole;
  strikes: number;
  createdAt: number;
}

interface PlatformIdentity {
  rawKey: string;
  nickname: string | null;
  source: Identity['source'];
}

/** 토스 환경에서 익명 키(해시)를 얻고, 아니면 기기 id로 대체한다. */
async function resolvePlatformIdentity(): Promise<PlatformIdentity> {
  try {
    const { getOperationalEnvironment, getAnonymousKey } = await import('@apps-in-toss/web-framework');
    const env = getOperationalEnvironment(); // 토스 밖에서는 throw
    if (env === 'toss' || env === 'sandbox') {
      const res = await getAnonymousKey();
      if (res && res !== 'ERROR') {
        return { rawKey: res.hash, nickname: null, source: 'toss' };
      }
    }
  } catch {
    /* 앱인토스 환경이 아님 → 기기 식별로 폴백 */
  }
  return { rawKey: getDeviceId(), nickname: '말미잘', source: 'device' };
}

/** React StrictMode에서도 익명 세션을 하나만 만들도록 진행 중인 요청을 공유한다. */
let identityRequest: Promise<Identity> | null = null;

/** 플랫폼 신원을 mock id 또는 Supabase가 발급한 검증 가능한 사용자 세션으로 바꾼다. */
async function resolveIdentityOnce(): Promise<Identity> {
  const platform = await resolvePlatformIdentity();
  if (!isSupabaseMode) {
    return {
      id: platform.source === 'toss' ? `toss:${platform.rawKey}` : platform.rawKey,
      nickname: platform.nickname,
      source: platform.source,
      role: 'creator',
      strikes: 0,
      createdAt: Date.now(),
    };
  }

  const supabase = getSupabaseClient();
  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    sessionData = { session: data.session };
  }
  if (!sessionData.session?.user) throw new Error('Supabase 익명 세션을 만들지 못했습니다.');

  const profile = await rpcOne<{
    id: string;
    nickname: string | null;
    role: 'creator' | 'admin';
    strikes: number;
    created_at: string;
  }>('claim_identity', {
    p_source: platform.source,
    p_raw_key: platform.rawKey,
    p_nickname: platform.nickname,
  });

  return {
    id: profile.id,
    nickname: profile.nickname,
    source: platform.source,
    role: profile.role,
    strikes: profile.strikes,
    createdAt: new Date(profile.created_at).getTime(),
  };
}

export function resolveIdentity(): Promise<Identity> {
  if (!identityRequest) {
    identityRequest = resolveIdentityOnce().catch((error: unknown) => {
      identityRequest = null;
      throw error;
    });
  }
  return identityRequest;
}

/* ── 운영 권한 판별 ─────────────────────────────────────────
 * Supabase 모드: users.role을 RLS/RPC가 서버에서 검증한다.
 * mock 모드: 허용 목록 또는 로컬 패스프레이즈를 개발 편의로만 사용한다.
 */

const ADMIN_ALLOWLIST = (import.meta.env?.VITE_ADMIN_KEYS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ADMIN_FLAG = 'endless-aquarium/admin-unlocked';

export function isAllowlistedAdmin(identityId: string): boolean {
  return ADMIN_ALLOWLIST.includes(identityId);
}

/** 로컬(비-토스) 개발용 임시 잠금 해제 여부. */
export function isLocallyUnlocked(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ADMIN_FLAG) === '1';
}

export function unlockLocalAdmin(passphrase: string): boolean {
  if (isSupabaseMode) return false;
  if (ADMIN_ACCESS_KEY && passphrase === ADMIN_ACCESS_KEY) {
    localStorage.setItem(ADMIN_FLAG, '1');
    return true;
  }
  return false;
}

interface AdminAccessResult {
  ok: boolean;
  error_code: 'invalid' | 'locked' | 'not_configured' | null;
  id: string;
  nickname: string | null;
  role: 'creator' | 'admin';
  strikes: number;
  created_at: string;
}

/** 서버에서 운영자 코드를 검증하고 현재 익명 세션에 운영 권한을 부여한다. */
export async function claimAdminAccess(passphrase: string, source: Identity['source']): Promise<Identity> {
  const result = await rpcOne<AdminAccessResult>('claim_admin_access', { p_code: passphrase });
  if (!result.ok) {
    if (result.error_code === 'locked') throw new Error('입력 횟수를 초과했어요. 15분 뒤 다시 시도해 주세요.');
    if (result.error_code === 'not_configured') throw new Error('서버에 운영자 코드가 아직 설정되지 않았어요.');
    throw new Error('운영자 코드가 올바르지 않아요.');
  }
  return {
    id: result.id,
    nickname: result.nickname,
    source,
    role: result.role,
    strikes: result.strikes,
    createdAt: new Date(result.created_at).getTime(),
  };
}

export function lockLocalAdmin(): void {
  localStorage.removeItem(ADMIN_FLAG);
}

/** 최종 운영 권한. Supabase 모드에서는 서버가 반환한 역할만 신뢰한다. */
export function resolveIsAdmin(identity: Identity): boolean {
  if (isSupabaseMode) return identity.role === 'admin';
  if (isAllowlistedAdmin(identity.id)) return true;
  if (identity.source === 'device') return isLocallyUnlocked();
  return false;
}
