import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMapViewport } from '../model/useMapViewport';

function mapElement(width = 1000, height = 800): HTMLDivElement {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
  });
  return element;
}

describe('수족관 카메라', () => {
  it('첫 진입 시 생물 분포 중앙을 화면 중앙에 둔다', async () => {
    const { result } = renderHook(() => useMapViewport({
      contentWidth: 5_200,
      contentHeight: 720,
      floorY: 1_350,
      initialWorldX: 2_500,
    }));

    act(() => result.current.bind.ref(mapElement()));
    await waitFor(() => {
      const centerWorldX = (result.current.size.w / 2 - result.current.pan.x) / result.current.zoom;
      expect(centerWorldX).toBeCloseTo(2_500);
    });
  });

  it('한 손가락 드래그의 세로 이동량을 카메라에 반영한다', async () => {
    const element = mapElement();
    const { result } = renderHook(() => useMapViewport({
      contentWidth: 5_200,
      contentHeight: 720,
      floorY: 1_350,
      initialWorldX: 2_500,
    }));
    act(() => result.current.bind.ref(element));
    await waitFor(() => expect(result.current.size.h).toBe(800));
    const before = result.current.pan.y;

    act(() => {
      result.current.bind.onPointerDown({
        target: element,
        pointerId: 1,
        clientX: 500,
        clientY: 400,
      } as unknown as React.PointerEvent);
      result.current.bind.onPointerMove({
        pointerId: 1,
        clientX: 500,
        clientY: 280,
      } as React.PointerEvent);
    });

    expect(result.current.pan.y).toBeLessThan(before);
  });
});
