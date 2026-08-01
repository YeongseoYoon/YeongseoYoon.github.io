import {
  FLOOR_Y,
  isAnchoredKind,
  spriteBaseSize,
  worldWidthFor,
  type Creature,
} from '@/entities/creature';

/**
 * 월드 배치 = 저장된 고정 좌표를 읽는 것뿐.
 * 예전처럼 매번 재계산하지 않으므로 생물이 늘어도 **기존 위치가 변하지 않는다**.
 */

export interface WorldCreature {
  creature: Creature;
  /** 앵커(고정 좌표) 기준 좌상단 */
  x: number;
  y: number;
  w: number;
  h: number;
  flip: boolean;
  /** 바닥 고정 여부 */
  anchored: boolean;
}

const DISPLAY_SCALE = 5.4;

export function toWorldCreatures(creatures: Creature[]): WorldCreature[] {
  return creatures.map((creature) => {
    const [bw, bh] = spriteBaseSize(creature.spriteKey);
    const w = Math.round(bw * DISPLAY_SCALE);
    const h = Math.round(bh * DISPLAY_SCALE);
    const anchored = isAnchoredKind(creature.kind);
    return {
      creature,
      x: creature.worldX,
      y: anchored ? FLOOR_Y - h + 10 : creature.worldY,
      w,
      h,
      flip: (creature.worldX >> 3) % 2 === 1,
      anchored,
    };
  });
}

export { worldWidthFor };
