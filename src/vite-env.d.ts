/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 로컬 개발용 운영 콘솔 패스프레이즈 재정의 (선택) */
  readonly VITE_ADMIN_KEY?: string;
  /** 운영자 허용 목록 — 앱인토스 익명 키 id들, 쉼표 구분 (예: "toss:abc,toss:def") */
  readonly VITE_ADMIN_KEYS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
