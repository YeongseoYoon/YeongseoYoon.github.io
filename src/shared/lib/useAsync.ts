import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** 수동 재조회 — 방류/조치 후 목록 갱신에 사용 */
  refetch: () => void;
}

/**
 * repository(Promise 반환)를 선언적으로 소비하는 훅.
 * 컴포넌트는 데이터 소스가 mock인지 실서버인지 알 필요가 없다(DIP).
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  // factory는 매 렌더 새로 생성되므로 deps로 실행 시점을 통제한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(factory, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    run()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [run, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refetch };
}
