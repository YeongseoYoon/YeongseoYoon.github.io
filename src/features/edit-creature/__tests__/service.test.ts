import { beforeEach, describe, expect, it } from 'vitest';
import { creatureApi } from '@/entities/creature';
import { resetDb } from '@/test/resetDb';
import { deleteMyCreature, updateCreatureMessage } from '../model/service';

const TARGET = 'c-nemo';

describe('작품 수정·삭제', () => {
  beforeEach(resetDb);

  it('TC-8-1 메시지를 수정하면 저장된다', async () => {
    const updated = await updateCreatureMessage(TARGET, '새 한마디');
    expect(updated.message).toBe('새 한마디');
  });

  it('TC-8-2 30자를 넘으면 거부한다', async () => {
    await expect(updateCreatureMessage(TARGET, '가'.repeat(31))).rejects.toThrow('30자');
  });

  it('TC-8-3 앞뒤 공백은 제거된다', async () => {
    expect((await updateCreatureMessage(TARGET, '  안녕  ')).message).toBe('안녕');
  });

  it('TC-8-4 본인 작품은 삭제된다', async () => {
    const target = (await creatureApi.get(TARGET))!;
    await deleteMyCreature(TARGET, target.authorId);
    expect(await creatureApi.get(TARGET)).toBeNull();
    expect((await creatureApi.listByStatus('deleted')).find((c) => c.id === TARGET)?.slot).toBe(target.slot);
  });

  it('TC-8-5 남의 작품은 삭제할 수 없다', async () => {
    await expect(deleteMyCreature(TARGET, '남의-아이디')).rejects.toThrow('내가 방류한');
  });

  it('TC-8-6 없는 작품 삭제는 거부한다', async () => {
    await expect(deleteMyCreature('nope', 'u1')).rejects.toThrow('이미 삭제');
  });

  it('TC-8-7 삭제해도 남은 생물의 좌표는 변하지 않는다', async () => {
    const others = (await creatureApi.listByStatus('published')).filter((c) => c.id !== TARGET);
    const before = others.map((c) => ({ id: c.id, x: c.worldX, y: c.worldY }));

    const target = (await creatureApi.get(TARGET))!;
    await deleteMyCreature(TARGET, target.authorId);

    const after = (await creatureApi.listByStatus('published')).map((c) => ({
      id: c.id, x: c.worldX, y: c.worldY,
    }));
    before.forEach((b) => expect(after).toContainEqual(b));
  });

  it('TC-8-8 중간 작품 삭제 후 새 작품이 삭제 슬롯을 재사용하지 않는다', async () => {
    const before = await creatureApi.listByStatus('published');
    const maxSlot = Math.max(...before.map((creature) => creature.slot));
    const target = (await creatureApi.get(TARGET))!;
    await deleteMyCreature(TARGET, target.authorId);

    const created = await creatureApi.create({
      kind: 'fish',
      name: '새 물고기',
      message: '',
      authorId: target.authorId,
      authorNickname: null,
      sprite: null,
      initialStatus: 'published',
      zoneId: target.zoneId,
    });

    expect(created.slot).toBeGreaterThan(maxSlot);
    expect(created.slot).not.toBe(target.slot);
    expect(before.some((creature) => creature.worldX === created.worldX && creature.worldY === created.worldY)).toBe(false);
  });
});
