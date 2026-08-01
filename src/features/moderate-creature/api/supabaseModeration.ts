import { rpcOne } from '@/shared/api';
import { creatureFromRow, type Creature, type CreatureRow } from '@/entities/creature';
import type { ModerationAction } from '@/entities/moderation-log';

export async function moderateCreatureOnServer(params: {
  creatureId: string;
  action: ModerationAction;
  reason: string;
  zoneId?: string | null;
}): Promise<Creature> {
  const row = await rpcOne<CreatureRow>('moderate_creature', {
    p_creature_id: params.creatureId,
    p_action: params.action,
    p_reason: params.reason,
    p_zone_id: params.zoneId ?? null,
  });
  return creatureFromRow(row);
}

