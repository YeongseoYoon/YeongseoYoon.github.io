import type { CreatureStatus } from './types';

/**
 * 작품 상태 머신 (PRD 8.1).
 *
 *   draft → pending → published → hidden → deleted
 *                  ↘ rejected → (수정) → pending
 *
 * 전이 규칙을 데이터로 선언한다. 새 상태/전이를 추가할 때 이 맵만 확장하면 되고,
 * 검증 로직(canTransition)은 손대지 않는다(OCP). 잘못된 전이는 여기서 한 번에 막힌다.
 */
const TRANSITIONS: Record<CreatureStatus, readonly CreatureStatus[]> = {
  draft: ['pending', 'deleted'],
  pending: ['published', 'rejected', 'hidden', 'deleted'],
  published: ['hidden', 'deleted'],
  rejected: ['pending', 'deleted'],
  hidden: ['published', 'deleted'],
  deleted: [],
};

export function canTransition(from: CreatureStatus, to: CreatureStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: CreatureStatus): readonly CreatureStatus[] {
  return TRANSITIONS[from];
}

/** 일반 사용자에게 공개적으로 보이는 상태인가. (탐험/구역 노출 판단) */
export function isPubliclyVisible(status: CreatureStatus): boolean {
  return status === 'published';
}

/** 창작자 본인의 "내 수조"에 남는 상태인가. (deleted 제외) */
export function isVisibleToOwner(status: CreatureStatus): boolean {
  return status !== 'deleted';
}
