import { db, isSupabaseMode } from '@/shared/api';
import type { Zone } from '../model/types';
import type { ZoneRepository } from '../model/repository';
import { seedZones } from './seed';
import { supabaseZoneApi } from './supabaseZoneApi';

const zones = db.collection<Zone>('zones', seedZones);

const mockZoneApi: ZoneRepository = {
  list: () => zones.list(),
  get: (id) => zones.find(id),
  update: (id, patch) => zones.update(id, patch),
};

export const zoneApi: ZoneRepository = isSupabaseMode ? supabaseZoneApi : mockZoneApi;
