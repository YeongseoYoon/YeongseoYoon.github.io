import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Viewport } from '../model/useMapViewport';
import { AquariumMap } from '../ui/AquariumMap';

const noop = () => undefined;

function viewport(floorScreenY: number): Viewport {
  return {
    zoom: 1,
    pan: { x: 0, y: 0 },
    size: { w: 1_000, h: 800 },
    minZoom: 0.5,
    maxZoom: 2,
    floorScreenY,
    didDrag: () => false,
    bind: {
      ref: noop,
      onPointerDown: noop,
      onPointerMove: noop,
      onPointerUp: noop,
      onWheel: noop,
    },
    zoomIn: noop,
    zoomOut: noop,
    focusOn: noop,
  };
}

describe('수족관 모래 바닥', () => {
  it('화면 높이의 15% 띠로 렌더링하고 카메라 바닥선을 따라 이동한다', () => {
    render(<AquariumMap placed={[]} viewport={viewport(680)} onSelect={noop} />);
    const sand = screen.getByTestId('sand-floor');

    expect(sand.style.height).toBe('15%');
    expect(sand.style.top).toBe('680px');
  });
});
