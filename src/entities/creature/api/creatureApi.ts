import { db } from '@/shared/api';
import { createId } from '@/shared/lib';
import type { Creature } from '../model/types';
import type { CreatureRepository, NewCreatureInput } from '../model/repository';
import { motionForKind } from '../model/meta';
import { slotToPoint } from '../model/worldCoords';
import { seedCreatures } from './seed';

const creatures = db.collection<Creature>('creatures', seedCreatures);

/**
 * 다음 슬롯 = 지금까지 배정된 슬롯 수.
 * 삭제된 자리는 재사용하지 않는다 → 기존 생물 좌표가 절대 바뀌지 않는다.
 */
async function allocateSlot(): Promise<number> {
  const all = await creatures.list();
  return all.length;
}

export const creatureApi: CreatureRepository = {
  get: (id) => creatures.find(id),
  listByZone: (zoneId, status = 'published') =>
    creatures.list((c) => c.zoneId === zoneId && c.status === status),
  listByAuthor: (authorId) =>
    creatures.list((c) => c.authorId === authorId && c.status !== 'deleted'),
  listByStatus: (status) => creatures.list((c) => c.status === status),
  listByIds: (ids) => creatures.list((c) => ids.includes(c.id)),

  create: async (input: NewCreatureInput) => {
    const now = Date.now();
    const status = input.initialStatus ?? 'published';
    const published = status === 'published';
    const slot = await allocateSlot();
    const { worldX, worldY } = slotToPoint(slot, input.kind);

    return creatures.insert({
      id: createId('c-'),
      kind: input.kind,
      motion: motionForKind(input.kind),
      name: input.name,
      message: input.message,
      status,
      authorId: input.authorId,
      authorNickname: input.authorNickname,
      zoneId: published ? (input.zoneId ?? null) : null,
      sprite: input.sprite,
      spriteKey: input.spriteKey ?? null,
      worldX,
      worldY,
      rejectionReason: null,
      createdAt: now,
      submittedAt: now,
      publishedAt: published ? now : null,
    });
  },

  update: (id, patch) => creatures.update(id, patch),
  remove: (id) => creatures.remove(id),
};
