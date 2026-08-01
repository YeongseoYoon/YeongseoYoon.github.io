import { getSupabaseClient } from '@/shared/api';
import type { ModerationLog } from '../model/types';
import type { ModerationLogRepository } from '../model/repository';

interface ModerationLogRow {
  id: string;
  creature_id: string;
  action: ModerationLog['action'];
  moderator: string;
  reason: string;
  created_at: string;
}

const fromRow = (row: ModerationLogRow): ModerationLog => ({
  id: row.id,
  creatureId: row.creature_id,
  action: row.action,
  moderator: row.moderator,
  reason: row.reason,
  createdAt: new Date(row.created_at).getTime(),
});

export const supabaseModerationLogApi: ModerationLogRepository = {
  create: async () => {
    throw new Error('Supabase 모드의 감사 로그는 서버 운영 함수에서만 생성됩니다.');
  },
  listRecent: async (limit = 8) => {
    const { data, error } = await getSupabaseClient()
      .from('moderation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as ModerationLogRow[]).map(fromRow);
  },
};

