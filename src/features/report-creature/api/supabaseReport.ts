import { rpcOne } from '@/shared/api';
import type { SubmitReportParams, SubmitReportResult } from '../model/service';

export async function submitReportOnServer(
  params: SubmitReportParams,
): Promise<SubmitReportResult> {
  try {
    const data = await rpcOne<{ auto_hidden: boolean }>('submit_report', {
      p_creature_id: params.creatureId,
      p_reason: params.reason,
      p_detail: params.detail ?? '',
    });
    return { autoHidden: data.auto_hidden };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('already reported') || message.includes('duplicate key')) {
      throw new Error('이미 신고한 작품이에요.');
    }
    if (message.includes('daily report limit')) {
      throw new Error('오늘 신고할 수 있는 횟수를 모두 사용했어요. 내일 다시 이용해 주세요.');
    }
    throw error;
  }
}
