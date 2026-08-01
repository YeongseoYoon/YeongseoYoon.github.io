import { describe, expect, it } from 'vitest';
import { nextZone, occupancyRatio } from '../model/lib';
import type { Zone } from '../model/types';

const zone = (id: string, order: number): Zone => ({
  id, name: id, subtitle: '', order, capacity: 100, acceptingReleases: true,
});
const zones = [zone('a', 1), zone('b', 2), zone('c', 3)];

describe('구역', () => {
  it('TC-9-4 다음 구역으로 순환 이동한다', () => {
    expect(nextZone(zones, 'a')?.id).toBe('b');
    expect(nextZone(zones, 'c')?.id).toBe('a');
  });

  it('빈 목록이면 null', () => {
    expect(nextZone([], 'a')).toBeNull();
  });

  it('TC-9-5 수용량 비율은 0~1로 제한된다', () => {
    expect(occupancyRatio(50, 100)).toBe(0.5);
    expect(occupancyRatio(200, 100)).toBe(1);
    expect(occupancyRatio(5, 0)).toBe(1);
  });
});
