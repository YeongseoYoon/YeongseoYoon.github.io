import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * Apps in Toss (앱인토스) — WebView 앱 설정.
 *
 * ⚠️ 콘솔 등록 필요: apps-in-toss.toss.im 콘솔에서 앱을 만들고 발급받은 값으로 교체하세요.
 *   - appName: 앱 고유 키 (deeplink `intoss://{appName}`에 사용)
 *   - brand.icon: 콘솔에서 발급한 아이콘 URL
 */
export default defineConfig({
  appName: 'endless-aquarium',
  brand: {
    displayName: '끝없는 수족관',
    primaryColor: '#21AFBF',
    icon: '',
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
