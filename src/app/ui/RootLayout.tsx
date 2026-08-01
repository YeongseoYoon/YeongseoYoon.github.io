import { Outlet } from 'react-router-dom';
import { useSession } from '@/entities/session';
import { DevPersonaBar } from './DevPersonaBar';

/** 앱 루트 레이아웃: 현재 라우트(Outlet) + 데모용 페르소나 바. */
export function RootLayout() {
  const { error } = useSession();
  return (
    <div className="h-full">
      {error && (
        <div className="fixed inset-x-3 top-3 z-[100] rounded-xl bg-negative px-4 py-3 text-sm font-semibold text-white shadow-lg">
          서버 연결에 실패했어요: {error.message}
        </div>
      )}
      <Outlet />
      <DevPersonaBar />
    </div>
  );
}
