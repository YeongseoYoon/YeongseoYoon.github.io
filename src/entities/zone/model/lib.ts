import type { Zone } from './types';

/** order 기준 다음 구역을 순환 탐색한다. 마지막 구역 다음은 첫 구역. */
export function nextZone(zones: Zone[], currentId: string): Zone | null {
  if (zones.length === 0) return null;
  const sorted = [...zones].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((z) => z.id === currentId);
  if (index === -1) return sorted[0];
  return sorted[(index + 1) % sorted.length];
}

/** 수용량 대비 현재 밀도 비율(0~1). */
export function occupancyRatio(count: number, capacity: number): number {
  if (capacity <= 0) return 1;
  return Math.min(1, count / capacity);
}
