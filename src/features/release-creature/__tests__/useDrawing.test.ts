import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CANVAS } from '@/shared/config';
import { decodeSprite, encodeSprite } from '@/shared/lib';
import { useDrawing } from '../model/useDrawing';

const W = CANVAS.width;
/** (col,row) → 셀 인덱스 */
const at = (col: number, row: number) => row * W + col;

describe('그리기 상태', () => {
  it('TC-5-1 브러시로 칠하면 해당 셀에 색이 들어간다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.paintCell(at(5, 5)));
    expect(result.current.pixels[at(5, 5)]).toBe(result.current.color);
  });

  it('TC-5-2 지우개는 칠한 셀만 지운다 (전체 지우기가 아니다)', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.paintCell(at(5, 5)));
    act(() => result.current.paintCell(at(9, 9)));

    act(() => result.current.setTool('eraser'));
    act(() => result.current.paintCell(at(5, 5)));

    expect(result.current.pixels[at(5, 5)]).toBeNull();
    expect(result.current.pixels[at(9, 9)]).not.toBeNull(); // 다른 칸은 살아있다
  });

  it('TC-5-3 스포이드는 색을 뽑고 브러시로 돌아간다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.setColor('#A026D9'));
    act(() => result.current.paintCell(at(2, 2)));
    act(() => result.current.setColor('#33CC95'));

    act(() => result.current.setTool('eyedropper'));
    act(() => result.current.paintCell(at(2, 2)));

    expect(result.current.color).toBe('#A026D9');
    expect(result.current.tool).toBe('brush');
  });

  it('TC-5-4 굵은 브러시는 주변 셀까지 칠한다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.setBrush(3));
    act(() => result.current.paintCell(at(5, 5)));

    const painted = result.current.pixels.filter((p) => p !== null).length;
    expect(painted).toBe(9); // 3×3
  });

  it('TC-5-5 캔버스 경계를 넘어 칠하지 않는다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.setBrush(3));
    act(() => result.current.paintCell(at(0, 0))); // 좌상단 모서리

    expect(result.current.pixels).toHaveLength(CANVAS.width * CANVAS.height);
    expect(result.current.pixels.filter((p) => p !== null).length).toBe(4); // 잘려서 2×2
  });

  it('TC-5-11 히스토리가 없으면 undo/redo가 비활성이다', () => {
    const { result } = renderHook(() => useDrawing());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('TC-5-6/7 undo는 획 단위로 되돌리고 redo로 복구한다', () => {
    const { result } = renderHook(() => useDrawing());

    act(() => result.current.beginStroke());
    act(() => result.current.paintCell(at(1, 1)));
    act(() => result.current.paintCell(at(2, 1))); // 같은 획

    act(() => result.current.beginStroke());
    act(() => result.current.paintCell(at(7, 7))); // 두 번째 획

    act(() => result.current.undo());
    // 두 번째 획만 사라지고 첫 획은 남는다
    expect(result.current.pixels[at(7, 7)]).toBeNull();
    expect(result.current.pixels[at(1, 1)]).not.toBeNull();
    expect(result.current.pixels[at(2, 1)]).not.toBeNull();

    act(() => result.current.redo());
    expect(result.current.pixels[at(7, 7)]).not.toBeNull();
  });

  it('TC-5-8 되돌린 뒤 새로 그리면 redo가 무효화된다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.beginStroke());
    act(() => result.current.paintCell(at(1, 1)));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.beginStroke());
    act(() => result.current.paintCell(at(4, 4)));
    expect(result.current.canRedo).toBe(false);
  });

  it('TC-5-9 전체 지우기는 모두 지우되 undo로 되살릴 수 있다', () => {
    const { result } = renderHook(() => useDrawing());
    act(() => result.current.beginStroke());
    act(() => result.current.paintCell(at(3, 3)));

    act(() => result.current.clear());
    expect(result.current.isEmpty).toBe(true);

    act(() => result.current.undo());
    expect(result.current.pixels[at(3, 3)]).not.toBeNull();
  });

  it('TC-5-10 기존 작품을 불러오면 그 그림에서 시작한다', () => {
    const source: (string | null)[] = Array(CANVAS.width * CANVAS.height).fill(null);
    source[at(6, 6)] = '#21afbf';
    const code = encodeSprite(source, CANVAS.width, CANVAS.height);

    const { result } = renderHook(() => useDrawing({ sprite: code }));

    expect(result.current.pixels[at(6, 6)]).toBe('#21afbf');
    expect(decodeSprite(result.current.spriteCode)!.pixels).toEqual(source);
  });
});
