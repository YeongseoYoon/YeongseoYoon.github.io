import { useState } from 'react';
import { Icon } from '@/shared/ui';
import { startEmailAccess, startKakaoAccess, type AccountAccessMode } from '../model/auth';

const KAKAO_ENABLED = import.meta.env?.VITE_AUTH_KAKAO_ENABLED === 'true';

interface AccountAccessSheetProps {
  mode: AccountAccessMode;
  hasLocalCreatures: boolean;
  initialNickname?: string;
  onClose: () => void;
}

export function AccountAccessSheet({
  mode,
  hasLocalCreatures,
  initialNickname = '',
  onClose,
}: AccountAccessSheetProps) {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState(initialNickname);
  const [busy, setBusy] = useState<'kakao' | 'email' | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const preserving = mode === 'preserve';

  async function run(kind: 'kakao' | 'email') {
    setBusy(kind);
    setError('');
    try {
      if (kind === 'kakao') await startKakaoAccess(mode, nickname);
      else {
        await startEmailAccess(mode, email, nickname);
        setSent(true);
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '로그인을 시작하지 못했어요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="absolute inset-0 z-[80] animate-fadeIn" role="dialog" aria-modal="true" aria-label="내 수조 로그인">
      <button className="absolute inset-0 bg-[rgba(7,45,52,.5)]" onClick={onClose} aria-label="닫기" />
      <section
        className="animate-sheetUp absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-[28px] bg-white px-6 pt-2.5 shadow-[0_-12px_40px_rgba(4,34,40,.28)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 26px)' }}
      >
        <span className="mx-auto mb-4 block h-1 w-[38px] rounded-full bg-black/15" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-bold tracking-tight">
              {preserving ? '내 수조 보관하기' : '내 수조 불러오기'}
            </h2>
            <p className="mb-0 mt-1 text-[13px] leading-relaxed text-ink-soft">
              {preserving
                ? '지금까지 그린 생물을 계정에 연결해 어디서든 관리해요.'
                : '보관할 때 사용한 계정으로 로그인하면 내 생물을 다시 만날 수 있어요.'}
            </p>
          </div>
          <button className="rounded-lg p-1.5 text-ink-faint" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </button>
        </div>

        {preserving && (
          <label className="mt-5 block">
            <span className="mb-1.5 block text-[12px] font-semibold text-ink-sub">수조 주인 이름 (선택)</span>
            <input
              value={nickname}
              maxLength={12}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="예: 산호집사"
              className="h-12 w-full rounded-xl border border-black/10 bg-[#f8f9f9] px-4 text-sm outline-none focus:border-brand"
            />
          </label>
        )}

        {!preserving && hasLocalCreatures && (
          <div className="mt-4 rounded-xl bg-[#fff7df] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#7b5a00]">
            이 브라우저에서 새로 만든 생물은 기존 수조와 자동으로 합쳐지지 않아요. 먼저 현재 수조를 보관하는 것을 권장해요.
          </div>
        )}

        {KAKAO_ENABLED && (
          <>
            <button
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#FEE500] text-sm font-bold text-[#191919] disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => void run('kakao')}
            >
              {busy === 'kakao' ? '카카오로 이동 중…' : '카카오로 계속하기'}
            </button>
            <div className="my-4 flex items-center gap-3 text-[11px] text-ink-faint">
              <span className="h-px flex-1 bg-black/10" /> 또는 이메일 <span className="h-px flex-1 bg-black/10" />
            </div>
          </>
        )}

        {!KAKAO_ENABLED && <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-sub">이메일로 계속하기</p>}

        {sent ? (
          <div className="rounded-xl bg-brand-bg px-4 py-4 text-center">
            <strong className="block text-sm text-brand-accessible">메일을 보냈어요</strong>
            <span className="mt-1 block text-[12px] leading-relaxed text-ink-soft">
              {email}에서 확인 링크를 눌러 주세요.
            </span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              aria-label="이메일"
              className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 px-3.5 text-sm outline-none focus:border-brand"
            />
            <button
              className="h-12 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
              disabled={busy !== null || !email.trim()}
              onClick={() => void run('email')}
            >
              {busy === 'email' ? '전송 중…' : '메일 받기'}
            </button>
          </div>
        )}

        {error && <p role="alert" className="mb-0 mt-3 text-center text-[12.5px] text-negative-accessible">{error}</p>}
        <p className="mb-0 mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
          닉네임은 중복될 수 있으며 로그인 정보로 사용하지 않아요.
        </p>
      </section>
    </div>
  );
}
