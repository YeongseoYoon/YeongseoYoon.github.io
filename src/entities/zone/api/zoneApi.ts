import { db } from '@/shared/api';
import type { Zone } from '../model/types';
import type { ZoneRepository } from '../model/repository';
import { seedZones } from './seed';

const zones = db.collection<Zone>('zones', seedZones);

export const zoneApi: ZoneRepository = {
  list: () => zones.list(),
  get: (id) => zones.find(id),
  update: (id, patch) => zones.update(id, patch),
};
