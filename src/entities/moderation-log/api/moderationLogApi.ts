import { db, isSupabaseMode } from '@/shared/api';
import { createId } from '@/shared/lib';
import type { ModerationLog } from '../model/types';
import type { ModerationLogRepository } from '../model/repository';
import { supabaseModerationLogApi } from './supabaseModerationLogApi';

const HOUR = 3_600_000;

const seedLogs = (): ModerationLog[] => [
  { id: 'm-1', creatureId: 'c-byeol', action: 'approve', moderator: '김바다', reason: '가이드 부합', createdAt: Date.now() - 0.5 * HOUR },
  { id: 'm-2', creatureId: 'c-tangtang', action: 'temp_hide', moderator: '김바다', reason: '신고 3회 누적, 확인 필요', createdAt: Date.now() - 0.8 * HOUR },
];

const logs = db.collection<ModerationLog>('moderationLogs', seedLogs);

const mockModerationLogApi: ModerationLogRepository = {
  create: (input) =>
    logs.insert({
      id: createId('m-'),
      creatureId: input.creatureId,
      action: input.action,
      moderator: input.moderator,
      reason: input.reason,
      createdAt: Date.now(),
    }),
  listRecent: async (limit = 8) => {
    const rows = await logs.list();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
};

export const moderationLogApi: ModerationLogRepository = isSupabaseMode
  ? supabaseModerationLogApi
  : mockModerationLogApi;
