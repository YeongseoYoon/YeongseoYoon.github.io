import { describe, expect, it } from 'vitest';
import {
  FLOOR_Y,
  SWIM_BAND,
  isAnchoredKind,
  slotToPoint,
  worldWidthFor,
} from '../model/worldCoords';

describe('고정 월드 좌표', () => {
  it('TC-2-1 같은 슬롯은 항상 같은 좌표를 준다', () => {
    expect(slotToPoint(7, 'fish')).toEqual(slotToPoint(7, 'fish'));
  });

  it('TC-2-2 슬롯이 늘어나도 기존 슬롯 좌표는 변하지 않는다', () => {
    const before = [0, 1, 2, 3].map((i) => slotToPoint(i, 'fish'));
    // 뒤에 100개가 더 생겼다고 가정하고 다시 계산
    [...Array(100)].forEach((_, i) => slotToPoint(i + 4, 'fish'));
    const after = [0, 1, 2, 3].map((i) => slotToPoint(i, 'fish'));
    expect(after).toEqual(before);
  });

  it('TC-2-3 해초·장식물은 바닥선에 앉는다', () => {
    expect(slotToPoint(3, 'seaweed').worldY).toBe(FLOOR_Y);
    expect(slotToPoint(9, 'decoration').worldY).toBe(FLOOR_Y);
  });

  it('TC-2-4 물고기는 바닥 위 SWIM_BAND 안에 배치된다', () => {
    for (let slot = 0; slot < 40; slot += 1) {
      const { worldY } = slotToPoint(slot, 'fish');
      expect(worldY).toBeGreaterThanOrEqual(FLOOR_Y - SWIM_BAND);
      expect(worldY).toBeLessThan(FLOOR_Y);
    }
  });

  it('TC-2-5 슬롯이 커지면 월드가 오른쪽으로 넓어진다', () => {
    expect(slotToPoint(50, 'fish').worldX).toBeGreaterThan(slotToPoint(0, 'fish').worldX);
  });

  it('TC-2-6 바닥 고정 종류는 해초·장식물뿐이다', () => {
    expect(isAnchoredKind('seaweed')).toBe(true);
    expect(isAnchoredKind('decoration')).toBe(true);
    expect(isAnchoredKind('fish')).toBe(false);
  });

  it('TC-2-7 월드 폭은 가장 먼 생물보다 넓고 최소치가 있다', () => {
    expect(worldWidthFor([])).toBeGreaterThanOrEqual(1200);
    const far = slotToPoint(60, 'fish');
    expect(worldWidthFor([{ worldX: far.worldX }])).toBeGreaterThan(far.worldX);
  });
});
