import { MESSAGE_MAX_LENGTH } from '@/shared/config';
import { isSpriteEmpty } from '@/shared/lib';
import { isSupabaseMode } from '@/shared/api';
import { creatureApi, type Creature, type CreatureKind } from '@/entities/creature';
import { zoneApi } from '@/entities/zone';
import { releaseCreatureOnServer, saveDraftOnServer } from '../api/supabaseRelease';

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

/**
 * 목업 환경의 방류 임계 구역을 직렬화한다.
 * 후보 확인과 작품 생성 사이에 다른 방류가 끼어 용량을 초과하지 않게 한다.
 * 실서버에서는 같은 규칙을 DB 트랜잭션으로 옮긴다.
 */
let releaseTail: Promise<void> = Promise.resolve();

function serializeRelease<T>(operation: () => Promise<T>): Promise<T> {
  const result = releaseTail.then(operation, operation);
  releaseTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** 방류 구역: 신규 방류를 허용하고 수용량이 남은 구역 중 무작위. */
async function pickReleaseZoneId(): Promise<string | null> {
  const zones = await zoneApi.list();
  const openZones = zones.filter((zone) => zone.acceptingReleases);
  const counts = await Promise.all(
    openZones.map(async (zone) => ({
      zone,
      published: (await creatureApi.listByZone(zone.id, 'published')).length,
    })),
  );
  const candidates = counts
    .filter(({ zone, published }) => published < zone.capacity)
    .map(({ zone }) => zone);
  if (candidates.length === 0) {
    throw new Error('지금은 방류 가능한 구역이 없어요. 잠시 후 다시 시도해 주세요.');
  }
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
  if (isSupabaseMode) return releaseCreatureOnServer({ ...input, name });
  return serializeRelease(async () => {
    const zoneId = await pickReleaseZoneId();
    const now = Date.now();

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
  });
}

/** 임시저장 (PRD 8.1 draft). */
export async function saveDraft(
  input: Omit<ReleaseInput, 'fromDraftId'> & { draftId?: string | null },
): Promise<Creature> {
  if (isSupabaseMode) return saveDraftOnServer(input);
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
