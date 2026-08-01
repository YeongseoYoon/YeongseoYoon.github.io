/** 최소 계정/식별 (PRD 10). 감상은 로그인 없이, 창작·신고는 식별 필요. */
export type UserRole = 'visitor' | 'creator' | 'admin';

export interface User {
  id: string;
  /** 익명 닉네임 (선택 입력, 무명 허용 — PRD 14.1) */
  nickname: string | null;
  role: UserRole;
  /** 제재 이력 개수 (운영 콘솔 표시) */
  strikes: number;
  createdAt: number;
}
