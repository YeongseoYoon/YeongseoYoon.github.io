import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';
import { RootLayout } from '../ui/RootLayout';

const ExplorePage = lazy(() =>
  import('@/pages/explore').then((module) => ({ default: module.ExplorePage })),
);
const DrawPage = lazy(() =>
  import('@/pages/draw').then((module) => ({ default: module.DrawPage })),
);
const MyTankPage = lazy(() =>
  import('@/pages/my-tank').then((module) => ({ default: module.MyTankPage })),
);
const PublicTankPage = lazy(() =>
  import('@/pages/public-tank').then((module) => ({ default: module.PublicTankPage })),
);
const AdminPage = lazy(() =>
  import('@/pages/admin').then((module) => ({ default: module.AdminPage })),
);

function deferred(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full place-items-center text-sm text-ink-faint">불러오는 중…</div>
      }
    >
      {page}
    </Suspense>
  );
}

/** 라우트 정의. RootLayout 아래에 각 화면(pages)이 매핑된다. */
export const router = createBrowserRouter(
  [
    {
      path: '/endless-aquarium/*',
      loader: ({ request }) => {
        const url = new URL(request.url);
        const nextPath = url.pathname.replace(/^\/endless-aquarium/, '') || '/';
        return redirect(`${nextPath}${url.search}${url.hash}`);
      },
    },
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: deferred(<ExplorePage />) },
        { path: 'draw', element: deferred(<DrawPage />) },
        { path: 'my-tank', element: deferred(<MyTankPage />) },
        { path: 'tank/:authorId', element: deferred(<PublicTankPage />) },
        { path: 'admin', element: deferred(<AdminPage />) },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
