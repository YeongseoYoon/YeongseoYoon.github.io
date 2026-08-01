import type { Creature, CreatureKind, CreatureStatus } from './types';

/** 방류(생성) 입력. id·좌표·시각 등 파생값은 저장소가 채운다. */
export interface NewCreatureInput {
  kind: CreatureKind;
  name: string;
  message: string;
  authorId: string;
  authorNickname: string | null;
  /** 팔레트+RLE로 인코딩된 스프라이트 문자열 */
  sprite: string | null;
  spriteKey?: string | null;
  /** 최초 상태 (기본 published — 신고 기반 사후 검토). 임시저장은 draft. */
  initialStatus?: CreatureStatus;
  zoneId?: string | null;
}

/**
 * 작품 저장소 추상 (DIP).
 * 조회는 도메인 질의로 노출해 소비자가 필터 로직을 몰라도 되게 한다.
 */
export interface CreatureRepository {
  get(id: string): Promise<Creature | null>;
  listByZone(zoneId: string, status?: CreatureStatus): Promise<Creature[]>;
  listByAuthor(authorId: string): Promise<Creature[]>;
  listByStatus(status: CreatureStatus): Promise<Creature[]>;
  listByIds(ids: string[]): Promise<Creature[]>;
  create(input: NewCreatureInput): Promise<Creature>;
  update(id: string, patch: Partial<Creature>): Promise<Creature>;
  /** 창작자 본인 삭제 (되돌리지 않음 — PRD 8.1 deleted) */
  remove(id: string): Promise<void>;
}
