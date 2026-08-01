import { MESSAGE_MAX_LENGTH } from '@/shared/config';
import { creatureApi, type Creature } from '@/entities/creature';

/**
 * 작품 한마디 수정 (PRD 8.2).
 * 공개 작품의 메시지를 바꾸면 즉시 저장되고, 다른 사용자는 다시 볼 때 최신 메시지를 본다.
 */
export async function updateCreatureMessage(id: string, message: string): Promise<Creature> {
  const trimmed = message.trim();
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`한마디는 ${MESSAGE_MAX_LENGTH}자까지예요.`);
  }
  return creatureApi.update(id, { message: trimmed });
}

/**
 * 창작자 본인 삭제 (PRD 6 · 8.1).
 * 저장소에서 제거한다. 좌표 슬롯은 재사용하지 않으므로 다른 생물 위치는 그대로다.
 */
export async function deleteMyCreature(id: string, requesterId: string): Promise<void> {
  const creature = await creatureApi.get(id);
  if (!creature) throw new Error('이미 삭제된 작품이에요.');
  if (creature.authorId !== requesterId) {
    throw new Error('내가 방류한 생물만 삭제할 수 있어요.');
  }
  await creatureApi.remove(id);
}
