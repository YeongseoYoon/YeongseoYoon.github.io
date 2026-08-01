import { describe, expect, it } from 'vitest';
import { CANVAS } from '@/shared/config';
import { getGuideLayout, GUIDE_OPTIONS_BY_KIND } from '../model/guideLayout';

describe('getGuideLayout', () => {
  it.each([
    ['clownfish', { left: 4, top: 10, width: 28, height: 12 }],
    ['weed', { left: 12, top: 4, width: 12, height: 24 }],
    ['star', { left: 9, top: 8, width: 18, height: 16 }],
  ])('%s 밑그림을 정수 셀에 중앙 정렬한다', (key, expected) => {
    expect(getGuideLayout(key)).toEqual(expected);
  });

  it('모든 밑그림이 캔버스 안의 정수 셀만 차지한다', () => {
    const keys = Object.values(GUIDE_OPTIONS_BY_KIND).flat().map((option) => option.key);
    expect(keys).toHaveLength(14);
    for (const key of keys) {
      const layout = getGuideLayout(key)!;
      expect(Object.values(layout).every(Number.isInteger)).toBe(true);
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.top).toBeGreaterThanOrEqual(0);
      expect(layout.left + layout.width).toBeLessThanOrEqual(CANVAS.width);
      expect(layout.top + layout.height).toBeLessThanOrEqual(CANVAS.height);
    }
  });

  it('알 수 없는 스프라이트는 표시하지 않는다', () => {
    expect(getGuideLayout('unknown')).toBeNull();
  });
});
