import { createBrowserRouter } from 'react-router-dom';
import { ExplorePage, DrawPage, MyTankPage, AdminPage } from '@/pages';
import { RootLayout } from '../ui/RootLayout';

/** 라우트 정의. RootLayout 아래에 각 화면(pages)이 매핑된다. */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <ExplorePage /> },
        { path: 'draw', element: <DrawPage /> },
        { path: 'my-tank', element: <MyTankPage /> },
        { path: 'admin', element: <AdminPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
