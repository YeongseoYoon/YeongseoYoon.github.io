import { useEffect, useState } from 'react';
import { completeAuthCallback } from '@/features/account-access/model/auth';

export function AuthCallbackPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    completeAuthCallback()
      .then((next) => {
        if (alive) window.location.replace(next);
      })
      .catch((reason: unknown) => {
        if (alive) setError(reason instanceof Error ? reason.message : '로그인을 완료하지 못했어요.');
      });
    return () => { alive = false; };
  }, []);

  return (
    <main className="grid h-full place-items-center bg-white px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full water-tank" />
        <h1 className="m-0 text-xl font-bold">내 수조를 불러오고 있어요</h1>
        {error ? (
          <>
            <p role="alert" className="mt-2 text-sm text-negative-accessible">{error}</p>
            <a href="/my-tank" className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white">내 수조로 돌아가기</a>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-faint">잠시만 기다려 주세요.</p>
        )}
      </div>
    </main>
  );
}
