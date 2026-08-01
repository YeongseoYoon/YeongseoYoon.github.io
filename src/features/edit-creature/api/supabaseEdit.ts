import { rpcOne, rpcVoid } from '@/shared/api';
import { creatureFromRow, type Creature, type CreatureRow } from '@/entities/creature';

export async function updateMessageOnServer(id: string, message: string): Promise<Creature> {
  const row = await rpcOne<CreatureRow>('update_creature_message', {
    p_creature_id: id,
    p_message: message,
  });
  return creatureFromRow(row);
}

export function deleteCreatureOnServer(id: string): Promise<void> {
  return rpcVoid('delete_creature', { p_creature_id: id });
}

