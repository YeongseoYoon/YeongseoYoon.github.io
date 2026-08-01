/** 운영자 조치 종류 (PRD 7.3). */
export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'hide'
  | 'delete'
  | 'restrict_user'
  | 'temp_hide';

/** 모든 조치에 운영자·시각·사유를 남긴다 (PRD 7.3). */
export interface ModerationLog {
  id: string;
  creatureId: string;
  action: ModerationAction;
  moderator: string;
  reason: string;
  createdAt: number;
}
