import { db, isSupabaseMode } from '@/shared/api';
import { createId } from '@/shared/lib';
import type { Report } from '../model/types';
import type { ReportRepository } from '../model/repository';
import { seedReports } from './seed';
import { supabaseReportApi } from './supabaseReportApi';

const reports = db.collection<Report>('reports', seedReports);

const mockReportApi: ReportRepository = {
  create: (input) =>
    reports.insert({
      id: createId('r-'),
      creatureId: input.creatureId,
      reporterId: input.reporterId,
      reason: input.reason,
      detail: input.detail?.trim() ?? '',
      createdAt: Date.now(),
      resolved: false,
    }),
  listByCreature: (creatureId) => reports.list((r) => r.creatureId === creatureId),
  listUnresolved: () => reports.list((r) => !r.resolved),
  hasReported: async (creatureId, reporterId) => {
    const rows = await reports.list(
      (r) => r.creatureId === creatureId && r.reporterId === reporterId,
    );
    return rows.length > 0;
  },
  countByReporterSince: async (reporterId, since) => {
    const rows = await reports.list(
      (report) => report.reporterId === reporterId && report.createdAt >= since,
    );
    return rows.length;
  },
  markResolvedByCreature: async (creatureId) => {
    const rows = await reports.list((r) => r.creatureId === creatureId && !r.resolved);
    // 순차 처리 — 동시에 쓰면 서로의 변경을 덮어쓸 수 있다.
    for (const row of rows) {
      await reports.update(row.id, { resolved: true });
    }
  },
};

export const reportApi: ReportRepository = isSupabaseMode ? supabaseReportApi : mockReportApi;
