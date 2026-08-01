import { getSupabaseClient, rpcOne, rpcVoid } from '@/shared/api';
import type { Creature } from '../model/types';
import type { CreatureRepository } from '../model/repository';

export interface CreatureRow {
  id: string;
  kind: Creature['kind'];
  motion: Creature['motion'];
  name: string;
  message: string;
  status: Creature['status'];
  author_id: string;
  author_nickname: string | null;
  zone_id: string | null;
  sprite: string | null;
  sprite_key: string | null;
  world_x: number;
  world_y: number;
  slot: number | string;
  rejection_reason: string | null;
  created_at: string;
  submitted_at: string | null;
  published_at: string | null;
}

const millis = (value: string | null): number | null => (value ? new Date(value).getTime() : null);

export function creatureFromRow(row: CreatureRow): Creature {
  return {
    id: row.id,
    kind: row.kind,
    motion: row.motion,
    name: row.name,
    message: row.message,
    status: row.status,
    authorId: row.author_id,
    authorNickname: row.author_nickname,
    zoneId: row.zone_id,
    sprite: row.sprite,
    spriteKey: row.sprite_key,
    worldX: row.world_x,
    worldY: row.world_y,
    slot: Number(row.slot),
    rejectionReason: row.rejection_reason,
    createdAt: new Date(row.created_at).getTime(),
    submittedAt: millis(row.submitted_at),
    publishedAt: millis(row.published_at),
  };
}

async function rows(query: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<Creature[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as CreatureRow[]).map(creatureFromRow);
}

export const supabaseCreatureApi: CreatureRepository = {
  get: async (id) => {
    const { data, error } = await getSupabaseClient()
      .from('creatures')
      .select('*')
      .eq('id', id)
      .neq('status', 'deleted')
      .maybeSingle();
    if (error) throw error;
    return data ? creatureFromRow(data as CreatureRow) : null;
  },
  listByZone: (zoneId, status = 'published') =>
    rows(
      getSupabaseClient()
        .from('creatures')
        .select('*')
        .eq('zone_id', zoneId)
        .eq('status', status)
        .order('slot'),
    ),
  listByAuthor: (authorId) =>
    rows(
      getSupabaseClient()
        .from('creatures')
        .select('*')
        .eq('author_id', authorId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false }),
    ),
  listByStatus: (status) =>
    rows(
      getSupabaseClient()
        .from('creatures')
        .select('*')
        .eq('status', status)
        .order('slot'),
    ),
  getPublicStats: async () => {
    const client = getSupabaseClient();
    const [countResult, edgeResult] = await Promise.all([
      client
        .from('creatures')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      client
        .from('creatures')
        .select('world_x')
        .eq('status', 'published')
        .order('world_x', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (countResult.error) throw countResult.error;
    if (edgeResult.error) throw edgeResult.error;
    return {
      count: countResult.count ?? 0,
      maxWorldX: Number((edgeResult.data as { world_x?: number } | null)?.world_x ?? 0),
    };
  },
  listPublicInWorldRange: (minWorldX, maxWorldX, limit = 300) =>
    rows(
      getSupabaseClient()
        .from('creatures')
        .select('*')
        .eq('status', 'published')
        .gte('world_x', Math.floor(minWorldX))
        .lte('world_x', Math.ceil(maxWorldX))
        .order('world_x')
        .limit(limit),
    ),
  listByIds: (ids) => {
    if (ids.length === 0) return Promise.resolve([]);
    return rows(
      getSupabaseClient()
        .from('creatures')
        .select('*')
        .in('id', ids)
        .neq('status', 'deleted'),
    );
  },
  create: async (input) => {
    const functionName = input.initialStatus === 'draft' ? 'save_draft' : 'release_creature';
    const row = await rpcOne<CreatureRow>(functionName, {
      p_kind: input.kind,
      p_name: input.name,
      p_message: input.message,
      p_sprite: input.sprite,
      p_draft_id: null,
    });
    return creatureFromRow(row);
  },
  update: async (id, patch) => {
    if (Object.keys(patch).every((key) => key === 'message')) {
      const row = await rpcOne<CreatureRow>('update_creature_message', {
        p_creature_id: id,
        p_message: patch.message ?? '',
      });
      return creatureFromRow(row);
    }
    throw new Error('Supabase 모드의 작품 변경은 서버 유스케이스를 통해서만 가능합니다.');
  },
  remove: (id) => rpcVoid('delete_creature', { p_creature_id: id }),
};
