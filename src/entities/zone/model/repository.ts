import type { Zone } from './types';

export interface ZoneRepository {
  list(): Promise<Zone[]>;
  get(id: string): Promise<Zone | null>;
  update(id: string, patch: Partial<Zone>): Promise<Zone>;
}
