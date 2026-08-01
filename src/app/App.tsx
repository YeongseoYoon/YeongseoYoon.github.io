import { RouterProvider } from 'react-router-dom';
import { SessionProvider } from '@/entities/session';
import { router } from './providers/router';

/** 앱 진입. 전역 프로바이더(세션) + 라우터 구성. */
export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
