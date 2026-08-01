import { DAILY_RELEASE_LIMIT } from '@/shared/config';
import { creatureApi, type Creature } from '@/entities/creature';

export interface ReleaseQuota {
  used: number;
  limit: number;
  remaining: number;
}

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** 오늘 방류로 카운트되는 작품인가 (제출되어 검토 중이거나 공개된 것). */
function countsTowardQuota(c: Creature, now: number): boolean {
  return (
    c.submittedAt != null &&
    isSameDay(c.submittedAt, now) &&
    (c.status === 'pending' || c.status === 'published')
  );
}

/** 창작자의 오늘 방류 한도 상태 (PRD 9 창작량). */
export async function getReleaseQuota(authorId: string, now = Date.now()): Promise<ReleaseQuota> {
  const mine = await creatureApi.listByAuthor(authorId);
  const used = mine.filter((c) => countsTowardQuota(c, now)).length;
  return { used, limit: DAILY_RELEASE_LIMIT, remaining: Math.max(0, DAILY_RELEASE_LIMIT - used) };
}
