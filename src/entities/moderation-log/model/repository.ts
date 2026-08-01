import type { ModerationAction, ModerationLog } from './types';

export interface NewModerationLogInput {
  creatureId: string;
  action: ModerationAction;
  moderator: string;
  reason: string;
}

export interface ModerationLogRepository {
  create(input: NewModerationLogInput): Promise<ModerationLog>;
  /** 최근 조치 순으로 반환 */
  listRecent(limit?: number): Promise<ModerationLog[]>;
}
