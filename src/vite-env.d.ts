/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 로컬 개발용 운영 콘솔 패스프레이즈 재정의 (선택) */
  readonly VITE_ADMIN_KEY?: string;
  /** 운영자 허용 목록 — 앱인토스 익명 키 id들, 쉼표 구분 (예: "toss:abc,toss:def") */
  readonly VITE_ADMIN_KEYS?: string;
  readonly VITE_API_MODE?: 'mock' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** 카카오톡 직접 공유용 JavaScript 키 (공개 가능한 플랫폼 키) */
  readonly VITE_KAKAO_JAVASCRIPT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
