import { getDeviceId } from '@/shared/lib';
import { ADMIN_ACCESS_KEY } from '@/shared/config';

/**
 * 신원 확인 (PRD 10). 가입 없이 사용자를 식별한다.
 *
 * - 토스(앱인토스) 환경: `getAnonymousKey()`의 해시를 신원으로 사용한다.
 *   → 백엔드 없이 사용자별 식별·방류 한도·운영 권한 판별이 가능하다.
 * - 일반 웹(로컬 개발): localStorage 기기 id로 대체한다.
 *
 * 실제 프로필(닉네임 등)이 필요하면 appLogin() + 서버 토큰 교환으로 확장한다.
 */
export interface Identity {
  id: string;
  nickname: string | null;
  source: 'toss' | 'device';
}

/** 토스 환경에서 익명 키(해시)로 신원을 확인. 아니면 기기 id로 대체. */
export async function resolveIdentity(): Promise<Identity> {
  try {
    const { getOperationalEnvironment, getAnonymousKey } = await import('@apps-in-toss/web-framework');
    const env = getOperationalEnvironment(); // 토스 밖에서는 throw
    if (env === 'toss' || env === 'sandbox') {
      const res = await getAnonymousKey();
      if (res && res !== 'ERROR') {
        return { id: `toss:${res.hash}`, nickname: null, source: 'toss' };
      }
    }
  } catch {
    /* 앱인토스 환경이 아님 → 기기 식별로 폴백 */
  }
  return { id: getDeviceId(), nickname: '말미잘', source: 'device' };
}

/* ── 운영 권한 판별 ─────────────────────────────────────────
 * 토스 환경: 허용 목록(내 익명 키)에 포함될 때만 운영자.
 * 로컬 개발: 패스프레이즈로 이 기기에서만 임시 잠금 해제(개발 편의).
 * ⚠️ 클라이언트 판별이므로 진짜 보안은 아니다. 배포 시 서버에서 익명 키를 검증할 것.
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
  if (passphrase === ADMIN_ACCESS_KEY) {
    localStorage.setItem(ADMIN_FLAG, '1');
    return true;
  }
  return false;
}

export function lockLocalAdmin(): void {
  localStorage.removeItem(ADMIN_FLAG);
}

/** 최종 운영 권한: 토스는 허용 목록으로, 로컬은 패스프레이즈로만 판별. */
export function resolveIsAdmin(identity: Identity): boolean {
  if (isAllowlistedAdmin(identity.id)) return true;
  if (identity.source === 'device') return isLocallyUnlocked();
  return false;
}
