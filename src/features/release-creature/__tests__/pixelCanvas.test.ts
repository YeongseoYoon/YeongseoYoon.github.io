import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CANVAS } from '@/shared/config';
import { PixelCanvas, pointToCellIndex } from '../ui/PixelCanvas';

function dispatchPointer(target: Element, type: string, clientX: number, clientY: number) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
  Object.defineProperty(event, 'pointerId', { value: 7 });
  fireEvent(target, event);
}

describe('PixelCanvas 포인터 입력', () => {
  it('화면 크기와 무관하게 손가락 좌표를 셀로 변환한다', () => {
    expect(pointToCellIndex(5, 5, { left: 0, top: 0, width: 360, height: 320 })).toBe(0);
    expect(pointToCellIndex(15, 5, { left: 0, top: 0, width: 360, height: 320 })).toBe(1);
    expect(pointToCellIndex(341, 303, { left: 0, top: 0, width: 342, height: 304 })).toBe(
      CANVAS.width * CANVAS.height - 1,
    );
    expect(pointToCellIndex(342, 303, { left: 0, top: 0, width: 342, height: 304 })).toBeNull();
  });

  it('같은 요소에 포인터가 캡처되어도 이동 좌표의 다음 셀을 칠한다', () => {
    const onPaintCell = vi.fn();
    const onStrokeStart = vi.fn();
    const view = render(createElement(PixelCanvas, {
      pixels: Array(CANVAS.width * CANVAS.height).fill(null),
      onPaintCell,
      onStrokeStart,
    }));
    const firstCell = view.getByRole('button', { name: '픽셀 0' });
    const surface = firstCell.parentElement as HTMLDivElement;
    surface.setPointerCapture = vi.fn();
    surface.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 360,
      bottom: 320,
      width: 360,
      height: 320,
      toJSON: () => ({}),
    });

    dispatchPointer(firstCell, 'pointerdown', 5, 5);
    dispatchPointer(surface, 'pointermove', 15, 5);
    dispatchPointer(surface, 'pointermove', 25, 5);

    expect(onStrokeStart).toHaveBeenCalledTimes(1);
    expect(onPaintCell.mock.calls.map(([index]) => index)).toEqual([0, 1, 2]);
  });
});
