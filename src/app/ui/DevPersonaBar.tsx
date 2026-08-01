import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/shared/lib';
import { useSession } from '@/entities/session';

const PUBLIC_NAV = [
  { to: '/', label: '탐험' },
  { to: '/draw', label: '그리기' },
  { to: '/my-tank', label: '내 수조' },
];

/**
 * 하단 내비게이션 바.
 * 운영 콘솔은 운영 권한(허용된 토스 계정/로컬 잠금 해제)이 있을 때만 노출한다(PRD 1·7 요구).
 */
export function DevPersonaBar() {
  const { isAdmin } = useSession();
  const { pathname } = useLocation();

  const items = isAdmin ? [...PUBLIC_NAV, { to: '/admin', label: '운영 콘솔' }] : PUBLIC_NAV;

  return (
    <div
      className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/10 bg-white/90 px-1.5 py-1.5 text-[12px] shadow-lg backdrop-blur"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
    >
      {items.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          className={cn(
            'whitespace-nowrap rounded-full px-2.5 py-1 font-semibold sm:px-3',
            pathname === n.to ? 'bg-brand text-white' : 'text-ink-sub hover:bg-black/5',
          )}
        >
          {n.label}
        </Link>
      ))}
    </div>
  );
}
