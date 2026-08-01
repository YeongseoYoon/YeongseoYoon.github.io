import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * Apps in Toss (앱인토스) — WebView 앱 설정.
 *
 * ⚠️ 콘솔 등록 필요: apps-in-toss.toss.im 콘솔의 앱 ID가 appName과 같아야 합니다.
 *   - appName: 앱 고유 키 (deeplink `intoss://{appName}`에 사용)
 *   - brand.icon: 배포 사이트의 정사각형 앱 아이콘
 */
export default defineConfig({
  appName: 'endless-aquarium',
  brand: {
    displayName: '끝없는 수족관',
    primaryColor: '#21AFBF',
    icon: 'https://endless-aquarium.vercel.app/app-icon.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
