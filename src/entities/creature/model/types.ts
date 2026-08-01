/** 생물 종류 (PRD 7.1: 물고기 / 해초 / 장식물) */
export type CreatureKind = 'fish' | 'seaweed' | 'decoration';

/**
 * 작품 상태 머신 (PRD 8.1, 사후 검토 모델)
 *   draft → published → hidden → deleted
 *                    ↘ rejected → published(재방류)
 */
export type CreatureStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'hidden'
  | 'deleted'
  | 'rejected';

/** 종류별 자동 적용 움직임 (PRD 7.1). 작품마다 고비용 물리를 쓰지 않는다(PRD 9). */
export type MotionKind = 'swim' | 'sway' | 'float' | 'still';

export interface Creature {
  id: string;
  kind: CreatureKind;
  motion: MotionKind;
  name: string;
  /** 작품 메시지 · 30자 이하 (PRD 7.1) */
  message: string;
  status: CreatureStatus;
  authorId: string;
  /** 창작자 닉네임 스냅샷 (무명이면 null) */
  authorNickname: string | null;
  /** 소속 구역 id (published일 때 유효) */
  zoneId: string | null;

  /**
   * 사용자가 그린 스프라이트 — 팔레트+RLE 인코딩 문자열.
   * 서버에는 이 문자열 하나만 저장하면 된다(TEXT 컬럼 1개).
   * @see shared/lib/spriteCodec
   */
  sprite: string | null;
  /** 프리셋 스프라이트 키 (assets/{spriteKey}.png). 시드 생물용 */
  spriteKey: string | null;

  /**
   * 고정 월드 좌표 (PRD 9 · 사용자 요청).
   * 방류 시 한 번 배정되고 이후 변하지 않는다 → "내 생물은 늘 그 자리".
   * 실제 헤엄치는 위치는 이 앵커 주변을 도는 **클라이언트 연출**이라 저장하지 않는다.
   */
  worldX: number;
  worldY: number;
  /** 영구 좌표 배정 번호. 삭제 후에도 보존되며 절대 재사용하지 않는다. */
  slot: number;

  /** 반려/숨김 사유 */
  rejectionReason: string | null;
  createdAt: number;
  submittedAt: number | null;
  publishedAt: number | null;
}
