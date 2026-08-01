/**
 * 제품 규칙 상수 (PRD 9 · 7.1). 매직넘버를 한곳에 모아 가독성·예측 가능성을 높인다.
 */

/** 그림 캔버스 픽셀 크기 — 작은 투명 캔버스 (PRD 9 그림 형식). 세부 표현을 위해 촘촘한 격자. */
export const CANVAS = {
  width: 36,
  height: 32,
} as const;

/** 그리기 브러시 굵기 (픽셀 단위) */
export const BRUSH_SIZES = [1, 2, 3] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

/** 작품 메시지 최대 길이 (PRD 7.1) */
export const MESSAGE_MAX_LENGTH = 30;

/** 일별 방류 한도 (PRD 9 창작량) */
export const DAILY_RELEASE_LIMIT = 3;

/** 신고 누적 임계 — 초과 시 운영자 확인 전까지 임시 숨김 (PRD 7.4) */
export const AUTO_HIDE_REPORT_THRESHOLD = 3;

/** 한 사용자가 같은 작품에 신고할 수 있는 최대 횟수 (남용 방지) */
export const MAX_REPORTS_PER_USER_PER_CREATURE = 1;

/** 한 사용자의 하루 신고 상한. 자동화·보복 신고로 운영 큐가 도배되는 것을 막는다. */
export const DAILY_REPORT_LIMIT = 10;

/**
 * 시각 API 지연 시뮬레이션 (ms) — 실제 네트워크 느낌.
 * 테스트에서는 0으로 두어 스위트가 느려지지 않게 한다.
 */
export const MOCK_LATENCY_MS = import.meta.env?.MODE === 'test' ? 0 : 260;

/**
 * 운영 콘솔 접근 열쇠 (PRD 7.3 · 6 운영자 역할).
 * 가입 없이 이 브라우저에서만 콘솔을 열기 위한 개발용 패스프레이즈.
 * ⚠️ 클라이언트 사이드 게이트 — 실제 보안이 아니다. 배포 시 서버 인증으로 대체할 것.
 * .env의 VITE_ADMIN_KEY로 재정의 가능.
 */
export const ADMIN_ACCESS_KEY = import.meta.env?.VITE_ADMIN_KEY?.trim() ?? '';
