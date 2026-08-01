import { beforeEach, describe, expect, it } from 'vitest';
import { creatureApi } from '@/entities/creature';
import { moderationLogApi } from '@/entities/moderation-log';
import { reportApi } from '@/entities/report';
import { userApi } from '@/entities/user';
import { resetDb } from '@/test/resetDb';
import { hideCreature, rejectCreature } from '../model/service';

/** 시드에서 신고 3건이 쌓인 공개 작품 */
const REPORTED = 'c-tangtang';
const MOD = { moderator: '김바다', reason: '가이드 3항 위반' };

describe('운영 조치', () => {
  beforeEach(resetDb);

  it('TC-7-1 숨김 처리하면 상태와 사유가 저장된다', async () => {
    const updated = await hideCreature({ creatureId: REPORTED, ...MOD });
    expect(updated.status).toBe('hidden');
    expect(updated.rejectionReason).toBe(MOD.reason);
  });

  it('TC-7-2 숨김 시 해당 작품의 신고가 종결된다', async () => {
    expect((await reportApi.listByCreature(REPORTED)).some((r) => !r.resolved)).toBe(true);
    await hideCreature({ creatureId: REPORTED, ...MOD });
    expect((await reportApi.listByCreature(REPORTED)).every((r) => r.resolved)).toBe(true);
  });

  it('TC-7-3 숨김 시 작성자 제재 이력이 서버에 누적된다', async () => {
    const target = (await creatureApi.get(REPORTED))!;
    const before = (await userApi.get(target.authorId))!.strikes;
    await hideCreature({ creatureId: REPORTED, ...MOD });
    expect((await userApi.get(target.authorId))!.strikes).toBe(before + 1);
  });

  it('TC-7-4 조치는 운영자·사유와 함께 기록된다', async () => {
    await hideCreature({ creatureId: REPORTED, ...MOD });
    const logs = await moderationLogApi.listRecent(20);
    const log = logs.find((l) => l.creatureId === REPORTED && l.action === 'hide');
    expect(log?.moderator).toBe(MOD.moderator);
    expect(log?.reason).toBe(MOD.reason);
  });

  it('TC-7-5 허용되지 않은 전이는 거부한다', async () => {
    await hideCreature({ creatureId: REPORTED, ...MOD });
    // hidden → rejected 는 상태 머신에 없다
    await expect(rejectCreature({ creatureId: REPORTED, ...MOD })).rejects.toThrow('허용되지 않은');
  });

  it('TC-7-6 없는 작품은 거부한다', async () => {
    await expect(hideCreature({ creatureId: 'nope', ...MOD })).rejects.toThrow('찾을 수 없');
  });
});
