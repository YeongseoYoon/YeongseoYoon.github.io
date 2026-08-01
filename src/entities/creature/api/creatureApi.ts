import { db } from '@/shared/api';
import { createId } from '@/shared/lib';
import type { Creature } from '../model/types';
import type { CreatureRepository, NewCreatureInput } from '../model/repository';
import { motionForKind } from '../model/meta';
import { canTransition } from '../model/status';
import { slotToPoint } from '../model/worldCoords';
import { seedCreatures } from './seed';

const creatures = db.collection<Creature>('creatures', seedCreatures);

/**
 * v6 이하 저장 데이터에는 slot이 없으므로 기존 배열 순서로 한 번 보정한다.
 * 좌표는 이미 저장된 값을 유지하고, 이후 슬롯만 그 뒤부터 단조 증가시킨다.
 */
let slotMigration: Promise<void> | null = null;

async function ensureSlots(): Promise<void> {
  const all = await creatures.list();
  const used = new Set(
    all.map((creature) => creature.slot).filter((slot): slot is number => Number.isInteger(slot)),
  );
  let next = 0;
  for (const creature of all) {
    if (Number.isInteger(creature.slot)) continue;
    while (used.has(next)) next += 1;
    await creatures.update(creature.id, { slot: next });
    used.add(next);
    next += 1;
  }
}

async function slotsReady(): Promise<void> {
  slotMigration ??= ensureSlots().catch((error) => {
    slotMigration = null;
    throw error;
  });
  return slotMigration;
}

export const creatureApi: CreatureRepository = {
  get: async (id) => {
    await slotsReady();
    const creature = await creatures.find(id);
    return creature?.status === 'deleted' ? null : creature;
  },
  listByZone: async (zoneId, status = 'published') => {
    await slotsReady();
    return creatures.list((c) => c.zoneId === zoneId && c.status === status);
  },
  listByAuthor: async (authorId) => {
    await slotsReady();
    return creatures.list((c) => c.authorId === authorId && c.status !== 'deleted');
  },
  listByStatus: async (status) => {
    await slotsReady();
    return creatures.list((c) => c.status === status);
  },
  listByIds: async (ids) => {
    await slotsReady();
    return creatures.list((c) => ids.includes(c.id) && c.status !== 'deleted');
  },

  create: async (input: NewCreatureInput) => {
    await slotsReady();
    return creatures.insertWith((all) => {
      const now = Date.now();
      const status = input.initialStatus ?? 'published';
      const published = status === 'published';
      const slot = all.reduce((max, creature) => Math.max(max, creature.slot), -1) + 1;
      const { worldX, worldY } = slotToPoint(slot, input.kind);

      return {
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
        slot,
        rejectionReason: null,
        createdAt: now,
        submittedAt: now,
        publishedAt: published ? now : null,
      };
    });
  },

  update: async (id, patch) => {
    await slotsReady();
    return creatures.update(id, patch);
  },
  remove: async (id) => {
    await slotsReady();
    const creature = await creatures.find(id);
    if (!creature || !canTransition(creature.status, 'deleted')) {
      throw new Error(`creatures #${id} cannot be deleted`);
    }
    await creatures.update(id, { status: 'deleted' });
  },
};
