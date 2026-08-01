import { mulberry32 } from '@/shared/lib';
import type { Creature, CreatureKind } from './types';

/**
 * 고정 월드 좌표계.
 *
 * 세계관: 세로(수심)는 고정, 생물이 늘면 **옆으로 넓어진다**.
 * 좌표는 "슬롯 번호"로 결정론적으로 계산되고, 한 번 배정되면 영구 저장된다.
 * → 나중에 누가 몇 마리를 더 풀어도 **기존 생물은 절대 움직이지 않는다**.
 *
 * 헤엄치는 위치는 저장하지 않는다. 앵커 주변을 도는 클라이언트 연출이라
 * 새로고침하면 앵커 근처에서 다시 시작하고, 사용자 간 동기화도 필요 없다.
 */

export const WORLD_HEIGHT = 1500;
export const FLOOR_H = 150;
export const FLOOR_Y = WORLD_HEIGHT - FLOOR_H;
/** 수면 아래 여백 — 생물이 화면 맨 위에 붙지 않도록 */
export const WATER_TOP = 140;

const SIDE_PAD = 120;
const COLUMN_W = 260;
/** 한 열에 배치할 수심 단계 수 */
const ROWS = 5;

/** 생물이 배치되는 물기둥 띠 높이 (바닥 위) — 세로 고정 카메라에서 전부 보이도록 */
export const SWIM_BAND = 720;

/** 앵커 주변을 헤엄치는 반경 (연출 전용, 저장 안 함) */
export const WANDER_RADIUS = 90;

export interface WorldPoint {
  worldX: number;
  worldY: number;
}

/**
 * 슬롯 번호 → 월드 좌표. 순수 함수라 서버/클라이언트 어디서 계산해도 같은 값이 나온다.
 * 바닥 생물(해초·장식물)은 바닥선에 앉는다.
 */
export function slotToPoint(slot: number, kind: CreatureKind): WorldPoint {
  const col = Math.floor(slot / ROWS);
  const row = slot % ROWS;
  const rnd = mulberry32(slot * 2654435761 + 17);

  const worldX = Math.round(SIDE_PAD + col * COLUMN_W + rnd() * (COLUMN_W * 0.55));

  if (isAnchoredKind(kind)) {
    return { worldX, worldY: FLOOR_Y };
  }

  // 세로는 고정 카메라라, 바닥 위 일정 띠 안에만 배치해야 전부 보인다.
  const bandTop = FLOOR_Y - SWIM_BAND;
  const usable = SWIM_BAND - 80;
  const worldY = Math.round(bandTop + (row / ROWS) * usable + rnd() * (usable / ROWS));
  return { worldX, worldY };
}

/** 바닥에 붙는 종류인가 (해초·장식물). */
export function isAnchoredKind(kind: CreatureKind): boolean {
  return kind === 'seaweed' || kind === 'decoration';
}

/** 이미 쓰인 좌표들로부터 다음 슬롯 번호를 구한다. */
export function nextSlot(existingCount: number): number {
  return existingCount;
}

/** 생물들이 차지한 월드 폭 (오른쪽 여백 포함). */
export function worldWidthFor(creatures: Pick<Creature, 'worldX'>[]): number {
  const maxX = creatures.reduce((m, c) => Math.max(m, c.worldX), 0);
  return Math.max(1200, Math.ceil((maxX + SIDE_PAD * 2) / COLUMN_W) * COLUMN_W);
}
