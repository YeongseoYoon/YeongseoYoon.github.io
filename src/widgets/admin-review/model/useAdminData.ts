import { useCallback, useEffect, useMemo } from 'react';
import { useAsync } from '@/shared/lib';
import { isSupabaseMode, subscribeToServerChanges } from '@/shared/api';
import { creatureApi, type Creature } from '@/entities/creature';
import { moderationLogApi, type ModerationLog } from '@/entities/moderation-log';
import { reportApi, type Report } from '@/entities/report';

export interface ReportGroup {
  creature: Creature;
  reports: Report[];
}

export interface AdminData {
  pending: Creature[];
  reportGroups: ReportGroup[];
  logs: ModerationLog[];
  loading: boolean;
  /** 조치 후 모든 큐를 갱신 */
  refetch: () => void;
}

/**
 * 운영 콘솔 데이터 (PRD 7.3).
 * 검토 대기(오래된 순) · 신고(작품별 그룹) · 최근 조치 기록을 함께 로드한다.
 */
export function useAdminData(): AdminData {
  const pendingQuery = useAsync(() => creatureApi.listByStatus('pending'), []);
  const reportsQuery = useAsync(() => reportApi.listUnresolved(), []);
  const logsQuery = useAsync(() => moderationLogApi.listRecent(), []);

  const reportedIds = useMemo(
    () => Array.from(new Set((reportsQuery.data ?? []).map((r) => r.creatureId))),
    [reportsQuery.data],
  );
  const reportedCreaturesQuery = useAsync(
    () => (reportedIds.length ? creatureApi.listByIds(reportedIds) : Promise.resolve<Creature[]>([])),
    [reportedIds.join(',')],
  );

  const pending = useMemo(
    () => [...(pendingQuery.data ?? [])].sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0)),
    [pendingQuery.data],
  );

  const reportGroups = useMemo<ReportGroup[]>(() => {
    const creatures = reportedCreaturesQuery.data ?? [];
    const reports = reportsQuery.data ?? [];
    return creatures
      .map((creature) => ({
        creature,
        reports: reports.filter((r) => r.creatureId === creature.id),
      }))
      .sort((a, b) => b.reports.length - a.reports.length);
  }, [reportedCreaturesQuery.data, reportsQuery.data]);

  const refetch = useCallback(() => {
    pendingQuery.refetch();
    reportsQuery.refetch();
    reportedCreaturesQuery.refetch();
    logsQuery.refetch();
  }, [pendingQuery.refetch, reportsQuery.refetch, reportedCreaturesQuery.refetch, logsQuery.refetch]);

  useEffect(() => {
    if (!isSupabaseMode) return;
    return subscribeToServerChanges(
      ['creatures', 'reports', 'moderation_logs'],
      refetch,
    );
  }, [refetch]);

  return {
    pending,
    reportGroups,
    logs: logsQuery.data ?? [],
    loading: pendingQuery.loading || reportsQuery.loading,
    refetch,
  };
}
