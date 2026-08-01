import { AUTO_HIDE_REPORT_THRESHOLD } from '@/shared/config';
import { canTransition, creatureApi } from '@/entities/creature';
import { moderationLogApi } from '@/entities/moderation-log';
import { reportApi, type ReportReason } from '@/entities/report';

export interface SubmitReportParams {
  creatureId: string;
  reporterId: string;
  reason: ReportReason;
  /** 주관식 상세 — '기타'는 필수 */
  detail?: string;
}

export interface SubmitReportResult {
  /** 신고 누적으로 임시 숨김 처리되었는지 */
  autoHidden: boolean;
}

/**
 * 신고 접수 유스케이스 (PRD 7.4).
 * - 같은 사용자의 중복 신고를 막는다(남용 방지).
 * - 누적 임계를 넘으면 운영자 확인 전까지 임시 숨김한다.
 */
export async function submitReport(params: SubmitReportParams): Promise<SubmitReportResult> {
  if (params.reason === 'etc' && !params.detail?.trim()) {
    throw new Error('기타를 선택하면 사유를 적어 주세요.');
  }

  const already = await reportApi.hasReported(params.creatureId, params.reporterId);
  if (already) {
    throw new Error('이미 신고한 작품이에요.');
  }

  await reportApi.create(params);

  const reports = await reportApi.listByCreature(params.creatureId);
  const unresolved = reports.filter((r) => !r.resolved).length;
  if (unresolved < AUTO_HIDE_REPORT_THRESHOLD) {
    return { autoHidden: false };
  }

  const creature = await creatureApi.get(params.creatureId);
  if (creature && canTransition(creature.status, 'hidden')) {
    await creatureApi.update(creature.id, { status: 'hidden' });
    await moderationLogApi.create({
      creatureId: creature.id,
      action: 'temp_hide',
      moderator: '자동',
      reason: `신고 ${unresolved}회 누적, 확인 필요`,
    });
    return { autoHidden: true };
  }
  return { autoHidden: false };
}
