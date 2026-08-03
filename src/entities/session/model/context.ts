import { createContext, useContext } from 'react';
import type { User } from '@/entities/user';

/**
 * 현재 뷰어(세션). 감상은 로그인 없이, 창작·신고·운영에는 신원이 필요하다(PRD 10).
 * 신원은 앱인토스 익명 키(또는 로컬 기기 id)로 확인한다.
 */
export interface SessionValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  /** 앱인토스 환경 여부 (로그인 UX 분기용) */
  inToss: boolean;
  /** 로그인 수단이 아직 연결되지 않아 현재 브라우저에서만 복구 가능한 상태. */
  isAnonymous: boolean;
  accountEmail: string | null;
  /** 인증 콜백·로그아웃 뒤 사용자 정보를 즉시 다시 불러온다. */
  refreshAccount: () => Promise<void>;
  /** 운영자 코드를 서버(로컬 mock에서는 개발 키)에서 검증한다. */
  unlockAdmin: (passphrase: string) => Promise<boolean>;
  lockAdmin: () => void;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
