import { beforeEach, describe, expect, it } from 'vitest';
import { creatureApi } from '../api/creatureApi';
import { resetDb } from '@/test/resetDb';

describe('공개 바다 범위 조회', () => {
  beforeEach(resetDb);

  it('전체 그림 본문 없이 계산할 통계와 카메라 범위 결과가 일치한다', async () => {
    const published = await creatureApi.listByStatus('published');
    const stats = await creatureApi.getPublicStats();
    const maxWorldX = Math.max(...published.map((creature) => creature.worldX));

    expect(stats).toEqual({ count: published.length, maxWorldX });

    const min = 0;
    const max = Math.floor(maxWorldX / 2);
    const ranged = await creatureApi.listPublicInWorldRange(min, max);
    expect(ranged.length).toBeGreaterThan(0);
    expect(ranged.every((creature) => creature.status === 'published')).toBe(true);
    expect(ranged.every((creature) => creature.worldX >= min && creature.worldX <= max)).toBe(true);
  });

  it('한 번에 내려받는 개수를 제한한다', async () => {
    const ranged = await creatureApi.listPublicInWorldRange(-10_000, 10_000, 3);
    expect(ranged).toHaveLength(3);
  });
});
