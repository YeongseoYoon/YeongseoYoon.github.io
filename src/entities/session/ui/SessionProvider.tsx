import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/entities/user';
import { SessionContext, type SessionValue } from '../model/context';
import {
  resolveIdentity,
  resolveIsAdmin,
  unlockLocalAdmin,
  lockLocalAdmin,
  type Identity,
} from '../model/auth';

/** identity → 현재 사용자(User). 운영자면 표시 닉네임을 '운영자'로 보정. */
function toUser(identity: Identity, isAdmin: boolean): User {
  return {
    id: identity.id,
    nickname: isAdmin ? (identity.nickname ?? '운영자') : identity.nickname,
    role: isAdmin ? 'admin' : 'creator',
    strikes: 0,
    createdAt: Date.now(),
  };
}

/** 세션(신원 + 권한)을 확인해 하위 트리에 제공한다. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminTick, setAdminTick] = useState(0); // 잠금 해제 후 재계산 트리거

  useEffect(() => {
    let alive = true;
    resolveIdentity().then((id) => {
      if (alive) {
        setIdentity(id);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = useMemo(
    () => (identity ? resolveIsAdmin(identity) : false),
    // adminTick으로 잠금 해제 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [identity, adminTick],
  );

  const unlockAdmin = useCallback((passphrase: string) => {
    const ok = unlockLocalAdmin(passphrase);
    if (ok) setAdminTick((n) => n + 1);
    return ok;
  }, []);

  const lockAdmin = useCallback(() => {
    lockLocalAdmin();
    setAdminTick((n) => n + 1);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user: identity ? toUser(identity, isAdmin) : null,
      loading,
      isAdmin,
      inToss: identity?.source === 'toss',
      unlockAdmin,
      lockAdmin,
    }),
    [identity, isAdmin, loading, unlockAdmin, lockAdmin],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
