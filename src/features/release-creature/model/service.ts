import { MESSAGE_MAX_LENGTH } from '@/shared/config';
import { isSpriteEmpty } from '@/shared/lib';
import { creatureApi, type Creature, type CreatureKind } from '@/entities/creature';
import { zoneApi } from '@/entities/zone';
import { getReleaseQuota } from './quota';

export interface ReleaseInput {
  kind: CreatureKind;
  name: string;
  message: string;
  /** 인코딩된 스프라이트 문자열 */
  sprite: string;
  authorId: string;
  authorNickname: string | null;
  /** 임시저장본에서 방류하는 경우 — 새로 만들지 않고 이 작품을 공개로 바꾼다 */
  fromDraftId?: string | null;
}

/** 방류 구역: 신규 방류를 허용하는 구역 중 무작위 (바다 아무 곳에나). */
async function pickReleaseZoneId(): Promise<string | null> {
  const zones = await zoneApi.list();
  const pool = zones.filter((z) => z.acceptingReleases);
  const candidates = pool.length ? pool : zones;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

function validate(input: ReleaseInput): string {
  const name = input.name.trim();
  if (!name) throw new Error('생물 이름을 지어 주세요.');
  if (input.message.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`한마디는 ${MESSAGE_MAX_LENGTH}자까지예요.`);
  }
  if (isSpriteEmpty(input.sprite)) throw new Error('먼저 생물을 그려 주세요.');
  return name;
}

/**
 * 방류 유스케이스 (PRD 5 · 7.1, 사후 검토 모델).
 * 검증을 통과하면 **바로 공개(published)** 되고, 문제가 있으면 신고로 검토 큐에 오른다.
 */
export async function releaseCreature(input: ReleaseInput): Promise<Creature> {
  const name = validate(input);

  const quota = await getReleaseQuota(input.authorId);
  if (quota.remaining <= 0) {
    throw new Error('오늘 방류 한도를 모두 사용했어요. 내일 다시 시도해 주세요.');
  }

  const zoneId = await pickReleaseZoneId();
  const now = Date.now();

  // 임시저장본을 방류하는 경우: 좌표를 새로 받기 위해 상태만 바꾸지 않고 갱신한다.
  if (input.fromDraftId) {
    return creatureApi.update(input.fromDraftId, {
      kind: input.kind,
      name,
      message: input.message.trim(),
      sprite: input.sprite,
      status: 'published',
      zoneId,
      publishedAt: now,
      submittedAt: now,
    });
  }

  return creatureApi.create({
    kind: input.kind,
    name,
    message: input.message.trim(),
    sprite: input.sprite,
    authorId: input.authorId,
    authorNickname: input.authorNickname,
    initialStatus: 'published',
    zoneId,
  });
}

/** 임시저장 (PRD 8.1 draft). 방류 한도를 쓰지 않는다. */
export async function saveDraft(
  input: Omit<ReleaseInput, 'fromDraftId'> & { draftId?: string | null },
): Promise<Creature> {
  const name = input.name.trim() || '이름 없는 생물';
  if (input.draftId) {
    return creatureApi.update(input.draftId, {
      kind: input.kind,
      name,
      message: input.message.trim(),
      sprite: input.sprite,
    });
  }
  return creatureApi.create({
    kind: input.kind,
    name,
    message: input.message.trim(),
    sprite: input.sprite,
    authorId: input.authorId,
    authorNickname: input.authorNickname,
    initialStatus: 'draft',
  });
}
