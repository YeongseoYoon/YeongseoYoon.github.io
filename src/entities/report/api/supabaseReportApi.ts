import { getSupabaseClient, rpcOne } from '@/shared/api';
import type { Report } from '../model/types';
import type { ReportRepository } from '../model/repository';

interface ReportRow {
  id: string;
  creature_id: string;
  reporter_id: string;
  reason: Report['reason'];
  detail: string;
  created_at: string;
  resolved: boolean;
}

const fromRow = (row: ReportRow): Report => ({
  id: row.id,
  creatureId: row.creature_id,
  reporterId: row.reporter_id,
  reason: row.reason,
  detail: row.detail,
  createdAt: new Date(row.created_at).getTime(),
  resolved: row.resolved,
});

export const supabaseReportApi: ReportRepository = {
  create: async (input) => {
    await rpcOne<{ auto_hidden: boolean }>('submit_report', {
      p_creature_id: input.creatureId,
      p_reason: input.reason,
      p_detail: input.detail ?? '',
    });
    const { data, error } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('creature_id', input.creatureId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return fromRow(data as ReportRow);
  },
  listByCreature: async (creatureId) => {
    const { data, error } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('creature_id', creatureId)
      .order('created_at');
    if (error) throw error;
    return (data as ReportRow[]).map(fromRow);
  },
  listUnresolved: async () => {
    const { data, error } = await getSupabaseClient()
      .from('reports')
      .select('*')
      .eq('resolved', false)
      .order('created_at');
    if (error) throw error;
    return (data as ReportRow[]).map(fromRow);
  },
  hasReported: async (creatureId, reporterId) => {
    const { count, error } = await getSupabaseClient()
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('creature_id', creatureId)
      .eq('reporter_id', reporterId);
    if (error) throw error;
    return (count ?? 0) > 0;
  },
  markResolvedByCreature: async () => {
    throw new Error('Supabase 모드의 신고 종결은 서버 운영 함수에서만 가능합니다.');
  },
};
