import type { Report, ReportReason } from './types';

export interface NewReportInput {
  creatureId: string;
  reporterId: string;
  reason: ReportReason;
  /** 주관식 상세 (기타 선택 시 필수) */
  detail?: string;
}

export interface ReportRepository {
  create(input: NewReportInput): Promise<Report>;
  listByCreature(creatureId: string): Promise<Report[]>;
  listUnresolved(): Promise<Report[]>;
  /** 남용 방지: 같은 사용자가 같은 작품을 이미 신고했는지 */
  hasReported(creatureId: string, reporterId: string): Promise<boolean>;
  markResolvedByCreature(creatureId: string): Promise<void>;
}
