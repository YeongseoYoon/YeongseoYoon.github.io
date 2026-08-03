import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assetUrl } from '@/shared/lib';
import { Button } from '@/shared/ui';
import { isSupabaseMode } from '@/shared/api';
import { useSession } from '@/entities/session';
import { AdminConsole } from '@/widgets/admin-review';

/**
 * 운영자 검토 페이지 (PRD 7.3). 운영 권한이 있는 신원만 콘솔을 볼 수 있다.
 * - Supabase 배포: 서버 운영자 코드를 검증해 현재 기기의 익명 세션을 승인한다.
 * - 로컬 개발: 패스프레이즈로 임시 잠금 해제한다.
 */
export function AdminPage() {
  const { isAdmin, loading, inToss } = useSession();

  if (loading) {
    return <div className="grid min-h-full place-items-center text-sm text-ink-faint">확인 중…</div>;
  }
  if (!isAdmin) {
    return <AdminGate inToss={inToss} serverMode={isSupabaseMode} />;
  }

  return (
    <div className="flex h-full flex-col bg-[#dfe6e9] p-0 lg:p-8">
      <div className="mx-auto mb-4 hidden w-full max-w-[1400px] items-center justify-between lg:flex">
        <span className="text-[13px] font-semibold text-ink-sub">운영 콘솔</span>
        <Link to="/" className="text-[13px] font-semibold text-brand-accessible hover:underline">
          ← 탐험으로 돌아가기
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <AdminConsole />
      </div>
    </div>
  );
}

/** 운영 권한이 없을 때의 게이트. */
function AdminGate({ inToss, serverMode }: { inToss: boolean; serverMode: boolean }) {
  const navigate = useNavigate();
  const { unlockAdmin, user } = useSession();
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    try {
      if (!await unlockAdmin(pass)) setError('운영자 코드가 올바르지 않아요.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '운영자 권한을 확인하지 못했어요.');
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-[#dfe6e9] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-[0_18px_48px_rgba(23,68,76,.16)]">
        <img src={assetUrl('puffer.png')} width={48} height={34} className="pixel mb-4" alt="" />
        <h1 className="m-0 text-lg font-bold tracking-tight">운영 콘솔</h1>
        {serverMode ? (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              발급받은 운영자 코드를 입력하세요. 서버가 코드를 검증한 뒤 이 기기의 익명 세션에 운영 권한을 부여합니다.
            </p>
            <div className="mt-4 flex h-11 items-center rounded-lg border border-black/15 px-3">
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleUnlock()}
                placeholder="운영자 코드"
                autoComplete="current-password"
                className="flex-1 border-none bg-transparent text-sm outline-none"
              />
            </div>
            {error && <p className="mt-2 text-[12.5px] text-negative-accessible">{error}</p>}
            <Button variant="primary" className="mt-4 h-11 w-full rounded-lg" onClick={() => void handleUnlock()} disabled={unlocking || !pass.trim()}>
              {unlocking ? '확인 중…' : '잠금 해제'}
            </Button>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
              새 기기에서도 같은 코드를 한 번 입력하면 됩니다. 5회 실패하면 15분 동안 잠겨요.
            </p>
          </>
        ) : inToss ? (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              이 토스 계정에는 운영 권한이 없어요. 아래 내 키를 <code className="rounded bg-black/5 px-1">VITE_ADMIN_KEYS</code>에 넣고 다시 배포하면 나만 콘솔을 볼 수 있어요.
            </p>
            <div className="mt-3 select-all break-all rounded-lg bg-[#f1f2f3] px-3 py-2 text-[12px] text-ink-sub">
              {user?.id ?? '(확인 중)'}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              로컬 개발 환경이에요. 운영자 열쇠를 입력하면 이 기기에서 콘솔이 열려요.
              <br />
              <span className="text-ink-faint">(앱인토스 배포 시엔 허용된 토스 계정만 접근합니다.)</span>
            </p>
            <div className="mt-4 flex h-11 items-center rounded-lg border border-black/15 px-3">
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleUnlock()}
                placeholder="운영자 열쇠"
                className="flex-1 border-none bg-transparent text-sm outline-none"
              />
            </div>
            {error && <p className="mt-2 text-[12.5px] text-negative-accessible">{error}</p>}
            <Button variant="primary" className="mt-4 h-11 w-full rounded-lg" onClick={() => void handleUnlock()} disabled={unlocking}>
              잠금 해제
            </Button>
          </>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-3 w-full text-center text-[13px] font-semibold text-ink-sub hover:underline"
        >
          탐험으로 돌아가기
        </button>
      </div>
    </div>
  );
}
