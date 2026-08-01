import { describe, expect, it } from 'vitest';
import { REPORT_REASONS, reportReasonLabel } from '../model/reasons';

describe('신고 사유', () => {
  it('TC-9-7 모든 사유에 라벨이 있다', () => {
    REPORT_REASONS.forEach((r) => {
      expect(reportReasonLabel(r.value)).toBe(r.label);
      expect(r.label.length).toBeGreaterThan(0);
    });
  });

  it('괴롭힘 사유와 기타(주관식)가 포함된다', () => {
    const values = REPORT_REASONS.map((r) => r.value);
    expect(values).toContain('harassment');
    expect(values).toContain('etc');
  });
});
