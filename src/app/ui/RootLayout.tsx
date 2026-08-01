import { Outlet } from 'react-router-dom';
import { DevPersonaBar } from './DevPersonaBar';

/** 앱 루트 레이아웃: 현재 라우트(Outlet) + 데모용 페르소나 바. */
export function RootLayout() {
  return (
    <div className="h-full">
      <Outlet />
      <DevPersonaBar />
    </div>
  );
}
