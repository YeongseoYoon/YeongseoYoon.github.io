import { getSupabaseClient, rpcOne } from '@/shared/api';
import { creatureFromRow, type Creature, type CreatureRow } from '@/entities/creature';
import type { ReleaseInput } from '../model/service';
import type { ReleaseQuota } from '../model/quota';
import { DAILY_RELEASE_LIMIT } from '@/shared/config';

const params = (input: ReleaseInput, draftId: string | null) => ({
  p_kind: input.kind,
  p_name: input.name,
  p_message: input.message,
  p_sprite: input.sprite,
  p_draft_id: draftId,
});

export async function releaseCreatureOnServer(input: ReleaseInput): Promise<Creature> {
  try {
    const row = await rpcOne<CreatureRow>(
      'release_creature',
      params(input, input.fromDraftId ?? null),
    );
    return creatureFromRow(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('daily release limit')) {
      throw new Error('오늘 방류 한도를 모두 사용했어요. 내일 다시 시도해 주세요.');
    }
    if (message.includes('no release zone')) {
      throw new Error('지금은 방류 가능한 구역이 없어요. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  }
}

export async function saveDraftOnServer(
  input: Omit<ReleaseInput, 'fromDraftId'> & { draftId?: string | null },
): Promise<Creature> {
  const row = await rpcOne<CreatureRow>('save_draft', params(input, input.draftId ?? null));
  return creatureFromRow(row);
}

export async function getReleaseQuotaFromServer(
  authorId: string,
  now = Date.now(),
): Promise<ReleaseQuota> {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const { count, error } = await getSupabaseClient()
    .from('creatures')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authorId)
    .gte('submitted_at', start.toISOString())
    .lt('submitted_at', end.toISOString());
  if (error) throw error;
  const used = count ?? 0;
  return {
    used,
    limit: DAILY_RELEASE_LIMIT,
    remaining: Math.max(0, DAILY_RELEASE_LIMIT - used),
  };
}
