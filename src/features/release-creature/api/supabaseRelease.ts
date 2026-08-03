import { rpcOne } from '@/shared/api';
import { creatureFromRow, type Creature, type CreatureRow } from '@/entities/creature';
import type { ReleaseInput } from '../model/service';

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
