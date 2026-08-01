import { canTransition, creatureApi, type Creature, type CreatureStatus } from '@/entities/creature';
import { moderationLogApi, type ModerationAction } from '@/entities/moderation-log';
import { reportApi } from '@/entities/report';
import { userApi } from '@/entities/user';

/**
 * 운영 조치 유스케이스 (PRD 7.3).
 *
 * 단일 책임: "상태 전이 + 감사 로그(+신고 처리)"를 한 트랜잭션처럼 묶는다.
 * 모든 조치는 상태 머신(canTransition)으로 검증되고, 사유와 함께 기록된다.
 */

interface ModerateParams {
  creatureId: string;
  moderator: string;
  reason: string;
}

async function applyAction(
  creature: Creature,
  to: CreatureStatus,
  action: ModerationAction,
  params: ModerateParams,
  extraPatch: Partial<Creature> = {},
): Promise<Creature> {
  if (!canTransition(creature.status, to)) {
    throw new Error(`허용되지 않은 전이: ${creature.status} → ${to}`);
  }
  const updated = await creatureApi.update(creature.id, { status: to, ...extraPatch });
  await moderationLogApi.create({
    creatureId: creature.id,
    action,
    moderator: params.moderator,
    reason: params.reason,
  });
  return updated;
}

/**
 * 제재 이력 누적 (PRD 6 · 7.3).
 * 창작자 화면에는 노출하지 않고 **서버(저장소)에만** 기록해 운영 콘솔에서만 참고한다.
 */
async function addStrike(authorId: string): Promise<void> {
  const author = await userApi.get(authorId);
  if (author) await userApi.update(authorId, { strikes: author.strikes + 1 });
}

async function require(creatureId: string): Promise<Creature> {
  const creature = await creatureApi.get(creatureId);
  if (!creature) throw new Error(`작품 #${creatureId}을(를) 찾을 수 없어요`);
  return creature;
}

/** 승인 후 지정 구역에 방류(published). */
export async function approveCreature(params: ModerateParams & { zoneId: string }): Promise<Creature> {
  const creature = await require(params.creatureId);
  return applyAction(creature, 'published', 'approve', params, {
    zoneId: params.zoneId,
    publishedAt: Date.now(),
    rejectionReason: null,
  });
}

/** 반려 — 사유를 창작자에게 안내(수정 후 재제출 가능). */
export async function rejectCreature(params: ModerateParams): Promise<Creature> {
  const creature = await require(params.creatureId);
  const updated = await applyAction(creature, 'rejected', 'reject', params, {
    rejectionReason: params.reason,
  });
  await addStrike(creature.authorId);
  return updated;
}

/** 숨김 — 공개물을 비공개 처리하고 관련 신고를 종결. */
export async function hideCreature(params: ModerateParams): Promise<Creature> {
  const creature = await require(params.creatureId);
  const updated = await applyAction(creature, 'hidden', 'hide', params, {
    rejectionReason: params.reason,
  });
  await reportApi.markResolvedByCreature(creature.id);
  await addStrike(creature.authorId);
  return updated;
}

/** 신고 누적으로 인한 임시 숨김 (운영자 확인 전까지). */
export async function tempHideCreature(params: ModerateParams): Promise<Creature> {
  const creature = await require(params.creatureId);
  if (!canTransition(creature.status, 'hidden')) return creature;
  return applyAction(creature, 'hidden', 'temp_hide', params);
}
