import type { ReportReason } from './types';

/** 신고 사유 — 일반적인 신고 폼과 동일한 객관식 + 기타(주관식). */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: '남을 괴롭히거나 비방해요' },
  { value: 'hate_sexual', label: '혐오 또는 성적인 콘텐츠예요' },
  { value: 'violence', label: '폭력적이거나 위협적이에요' },
  { value: 'privacy', label: '개인정보가 담겨 있어요' },
  { value: 'copyright', label: '저작권을 침해했어요' },
  { value: 'spam', label: '스팸 또는 광고예요' },
  { value: 'etc', label: '기타 (직접 입력)' },
];

const REASON_LABEL = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ReportReason, string>;

export function reportReasonLabel(reason: ReportReason): string {
  return REASON_LABEL[reason];
}
