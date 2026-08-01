import { beforeEach, describe, expect, it } from 'vitest';
import { CANVAS, DAILY_RELEASE_LIMIT } from '@/shared/config';
import { encodeSprite } from '@/shared/lib';
import { creatureApi } from '@/entities/creature';
import { zoneApi } from '@/entities/zone';
import { resetDb } from '@/test/resetDb';
import { releaseCreature, saveDraft } from '../model/service';
import { getReleaseQuota } from '../model/quota';

const AUTHOR = 'user-test';

function drawing(): string {
  const pixels: (string | null)[] = Array(CANVAS.width * CANVAS.height).fill(null);
  pixels[10] = '#f8820d';
  pixels[11] = '#f8820d';
  return encodeSprite(pixels, CANVAS.width, CANVAS.height);
}
const empty = () =>
  encodeSprite(Array(CANVAS.width * CANVAS.height).fill(null), CANVAS.width, CANVAS.height);

const base = { kind: 'fish' as const, name: '금붕어', message: '안녕', authorId: AUTHOR, authorNickname: null };

describe('방류', () => {
  beforeEach(resetDb);

  it('TC-4-1 이름이 없으면 거부한다', async () => {
    await expect(releaseCreature({ ...base, name: '  ', sprite: drawing() })).rejects.toThrow(
      '생물 이름',
    );
  });

  it('TC-4-2 빈 그림은 거부한다', async () => {
    await expect(releaseCreature({ ...base, sprite: empty() })).rejects.toThrow('먼저 생물을 그려');
  });

  it('TC-4-3 메시지가 30자를 넘으면 거부한다', async () => {
    await expect(
      releaseCreature({ ...base, message: '가'.repeat(31), sprite: drawing() }),
    ).rejects.toThrow('30자');
  });

  it('TC-4-4 정상 방류는 즉시 공개되고 구역·좌표가 배정된다', async () => {
    const created = await releaseCreature({ ...base, sprite: drawing() });
    expect(created.status).toBe('published');
    expect(created.zoneId).toBeTruthy();
    expect(created.publishedAt).toBeTruthy();
    expect(Number.isFinite(created.worldX)).toBe(true);
    expect(Number.isFinite(created.worldY)).toBe(true);
  });

  it('TC-4-10 이름 앞뒤 공백은 제거된다', async () => {
    const created = await releaseCreature({ ...base, name: '  금붕어  ', sprite: drawing() });
    expect(created.name).toBe('금붕어');
  });

  it('TC-4-5 새 작품은 기존 생물과 다른 좌표를 받는다', async () => {
    const before = await creatureApi.listByStatus('published');
    const created = await releaseCreature({ ...base, sprite: drawing() });
    const collision = before.some((c) => c.worldX === created.worldX && c.worldY === created.worldY);
    expect(collision).toBe(false);
  });

  it('TC-4-6 일별 한도를 넘으면 거부한다', async () => {
    for (let i = 0; i < DAILY_RELEASE_LIMIT; i += 1) {
      await releaseCreature({ ...base, name: `물고기${i}`, sprite: drawing() });
    }
    await expect(releaseCreature({ ...base, sprite: drawing() })).rejects.toThrow('한도');
  });

  it('TC-4-7 한도는 오늘 제출분만 센다', async () => {
    const created = await releaseCreature({ ...base, sprite: drawing() });
    expect((await getReleaseQuota(AUTHOR)).used).toBe(1);

    // 어제 제출로 되돌리면 오늘 한도에서 빠진다
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    await creatureApi.update(created.id, { submittedAt: yesterday });
    expect((await getReleaseQuota(AUTHOR)).used).toBe(0);
  });

  it('TC-4-8 임시저장은 draft이고 한도를 쓰지 않는다', async () => {
    const draft = await saveDraft({ ...base, sprite: drawing() });
    expect(draft.status).toBe('draft');
    expect((await getReleaseQuota(AUTHOR)).used).toBe(0);
  });

  it('TC-4-9 임시저장본을 방류하면 새로 만들지 않고 같은 작품이 공개된다', async () => {
    const draft = await saveDraft({ ...base, sprite: drawing() });
    const released = await releaseCreature({ ...base, sprite: drawing(), fromDraftId: draft.id });

    expect(released.id).toBe(draft.id);
    expect(released.status).toBe('published');
    const mine = await creatureApi.listByAuthor(AUTHOR);
    expect(mine).toHaveLength(1);
  });

  it('TC-4-11 모든 구역이 중지되면 방류를 거부한다', async () => {
    const zones = await zoneApi.list();
    await Promise.all(zones.map((zone) => zoneApi.update(zone.id, { acceptingReleases: false })));

    await expect(releaseCreature({ ...base, sprite: drawing() })).rejects.toThrow('방류 가능한 구역');
  });

  it('TC-4-12 열린 구역이 모두 만석이면 방류를 거부한다', async () => {
    const zones = await zoneApi.list();
    const [target, ...closed] = zones;
    await Promise.all(closed.map((zone) => zoneApi.update(zone.id, { acceptingReleases: false })));
    const count = (await creatureApi.listByZone(target.id, 'published')).length;
    await zoneApi.update(target.id, { acceptingReleases: true, capacity: count });

    await expect(releaseCreature({ ...base, sprite: drawing() })).rejects.toThrow('방류 가능한 구역');
  });

  it('TC-4-13 남은 한 자리로 동시 방류해도 수용량을 넘지 않는다', async () => {
    const zones = await zoneApi.list();
    const [target, ...closed] = zones;
    await Promise.all(closed.map((zone) => zoneApi.update(zone.id, { acceptingReleases: false })));
    const count = (await creatureApi.listByZone(target.id, 'published')).length;
    await zoneApi.update(target.id, { acceptingReleases: true, capacity: count + 1 });

    const results = await Promise.allSettled([
      releaseCreature({ ...base, authorId: 'capacity-a', name: '동시A', sprite: drawing() }),
      releaseCreature({ ...base, authorId: 'capacity-b', name: '동시B', sprite: drawing() }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await creatureApi.listByZone(target.id, 'published')).toHaveLength(count + 1);
  });

  it('TC-12-2 동시 생성된 작품은 모두 고유한 슬롯을 받는다', async () => {
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        creatureApi.create({
          kind: 'fish',
          name: `동시 물고기 ${index}`,
          message: '',
          authorId: `slot-user-${index}`,
          authorNickname: null,
          sprite: drawing(),
          initialStatus: 'draft',
        }),
      ),
    );

    expect(new Set(created.map((creature) => creature.slot))).toHaveLength(created.length);
    expect(new Set(created.map((creature) => `${creature.worldX}:${creature.worldY}`))).toHaveLength(created.length);
  });
});
