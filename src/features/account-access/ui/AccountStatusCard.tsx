import { useState } from 'react';
import { useSession } from '@/entities/session';
import { signOutAccount, type AccountAccessMode } from '../model/auth';

interface AccountStatusCardProps {
  onOpen: (mode: AccountAccessMode) => void;
}

export function AccountStatusCard({ onOpen }: AccountStatusCardProps) {
  const { isAnonymous, accountEmail, refreshAccount } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (isAnonymous) {
    return (
      <aside className="mx-5 mb-3 rounded-2xl border border-brand/20 bg-brand-bg/70 px-4 py-3.5 lg:mx-0 lg:mb-4" aria-label="내 수조 보관 안내">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="block text-[14px] text-ink">이 수조는 이 브라우저에만 저장돼요</strong>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-soft">로그인하면 휴대폰이나 다른 컴퓨터에서도 내역을 관리할 수 있어요.</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="h-9 rounded-lg border border-brand/25 bg-white px-3 text-[12.5px] font-semibold text-brand-accessible" onClick={() => onOpen('restore')}>
              기존 수조 불러오기
            </button>
            <button className="h-9 rounded-lg bg-brand px-3 text-[12.5px] font-semibold text-white" onClick={() => onOpen('preserve')}>
              내 수조 보관하기
            </button>
          </div>
        </div>
      </aside>
    );
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await signOutAccount();
      await refreshAccount();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="mx-5 mb-3 flex items-center justify-between rounded-2xl bg-[#f5f7f7] px-4 py-3 lg:mx-0 lg:mb-4" aria-label="로그인 상태">
      <div className="min-w-0">
        <strong className="block text-[13px] text-ink">어디서든 관리 중</strong>
        <span className="block truncate text-[11.5px] text-ink-faint">{accountEmail ?? '카카오 계정으로 연결됨'}</span>
      </div>
      <button className="ml-3 shrink-0 text-[12px] font-semibold text-ink-soft" disabled={signingOut} onClick={() => void signOut()}>
        {signingOut ? '로그아웃 중…' : '로그아웃'}
      </button>
    </aside>
  );
}
