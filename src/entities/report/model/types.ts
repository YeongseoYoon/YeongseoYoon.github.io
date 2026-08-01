/** 신고 사유 (PRD 7.4). */
export type ReportReason =
  | 'harassment'
  | 'hate_sexual'
  | 'violence'
  | 'privacy'
  | 'copyright'
  | 'spam'
  | 'etc';

export interface Report {
  id: string;
  creatureId: string;
  reporterId: string;
  reason: ReportReason;
  /** 주관식 상세 설명 (기타 선택 시 필수, 그 외 선택 입력) */
  detail: string;
  createdAt: number;
  /** 운영자 처리 여부 */
  resolved: boolean;
}
