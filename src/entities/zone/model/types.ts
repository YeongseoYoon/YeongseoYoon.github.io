/** 탐험 구역 (PRD 9: 하나의 바다처럼 보이지만 내부적으로 여러 구역). */
export interface Zone {
  id: string;
  name: string;
  subtitle: string;
  /** 화면 순서 — "다음 구역으로 헤엄치기" 순서 */
  order: number;
  /** 구역별 수용량 (PRD 9 창작량) */
  capacity: number;
  /** 신규 방류 허용 여부 (운영자가 일시 중지 가능 — PRD 7.3) */
  acceptingReleases: boolean;
}
