import { getSupabaseClient } from '@/shared/api';
import type { Zone } from '../model/types';
import type { ZoneRepository } from '../model/repository';

interface ZoneRow {
  id: string;
  name: string;
  subtitle: string;
  order: number;
  capacity: number;
  accepting_releases: boolean;
}

const fromRow = (row: ZoneRow): Zone => ({
  id: row.id,
  name: row.name,
  subtitle: row.subtitle,
  order: row.order,
  capacity: row.capacity,
  acceptingReleases: row.accepting_releases,
});

export const supabaseZoneApi: ZoneRepository = {
  list: async () => {
    const { data, error } = await getSupabaseClient().from('zones').select('*').order('order');
    if (error) throw error;
    return (data as ZoneRow[]).map(fromRow);
  },
  get: async (id) => {
    const { data, error } = await getSupabaseClient().from('zones').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as ZoneRow) : null;
  },
  update: async (id, patch) => {
    const rowPatch: Partial<ZoneRow> = {};
    if (patch.name !== undefined) rowPatch.name = patch.name;
    if (patch.subtitle !== undefined) rowPatch.subtitle = patch.subtitle;
    if (patch.order !== undefined) rowPatch.order = patch.order;
    if (patch.capacity !== undefined) rowPatch.capacity = patch.capacity;
    if (patch.acceptingReleases !== undefined) rowPatch.accepting_releases = patch.acceptingReleases;
    const { data, error } = await getSupabaseClient()
      .from('zones')
      .update(rowPatch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return fromRow(data as ZoneRow);
  },
};

