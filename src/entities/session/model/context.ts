import { createContext, useContext } from 'react';
import type { User } from '@/entities/user';

/**
 * 현재 뷰어(세션). 감상은 로그인 없이, 창작·신고·운영에는 신원이 필요하다(PRD 10).
 * 신원은 앱인토스 익명 키(또는 로컬 기기 id)로 확인한다.
 */
export interface SessionValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  /** 앱인토스 환경 여부 (로그인 UX 분기용) */
  inToss: boolean;
  /** 로컬 개발용 운영자 잠금 해제. 성공 시 true. */
  unlockAdmin: (passphrase: string) => boolean;
  lockAdmin: () => void;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
  return ctx;
}
