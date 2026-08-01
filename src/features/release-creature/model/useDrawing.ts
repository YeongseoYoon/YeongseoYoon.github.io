import { useCallback, useMemo, useState } from 'react';
import { CANVAS, DRAW_PALETTE, type BrushSize } from '@/shared/config';
import { decodeSprite, encodeSprite } from '@/shared/lib';
import type { CreatureKind } from '@/entities/creature';

export type DrawTool = 'brush' | 'eraser' | 'eyedropper';

const CELL_COUNT = CANVAS.width * CANVAS.height;

/** 브러시 굵기 → 셀 오프셋 범위. */
function footprint(size: BrushSize): number[] {
  const half = Math.floor(size / 2);
  const range: number[] = [];
  for (let d = -half; d < -half + size; d += 1) range.push(d);
  return range;
}

export interface DrawingInit {
  kind?: CreatureKind;
  name?: string;
  message?: string;
  /** 기존 작품을 불러와 이어 그리기 (반려/숨김 후 재작업, 임시저장 복구) */
  sprite?: string | null;
}

/**
 * 그리기 상태 (PRD 7.1 · 9).
 * 캔버스는 고정 크기의 투명 픽셀 배열이고, 저장·전송은 인코딩된 문자열로 한다.
 * 렌더(PixelCanvas)와 분리해 캔버스는 "표시 + 좌표→셀 변환"만 담당한다(SRP).
 */
/** 되돌리기 히스토리 최대 길이 (메모리 상한) */
const HISTORY_LIMIT = 40;

export function useDrawing(init: DrawingInit = {}) {
  const [past, setPast] = useState<(string | null)[][]>([]);
  const [future, setFuture] = useState<(string | null)[][]>([]);
  const [pixels, setPixels] = useState<(string | null)[]>(() => {
    if (init.sprite) {
      const decoded = decodeSprite(init.sprite);
      if (decoded && decoded.pixels.length === CELL_COUNT) return decoded.pixels;
    }
    return Array(CELL_COUNT).fill(null);
  });
  const [tool, setTool] = useState<DrawTool>('brush');
  const [color, setColor] = useState<string>(DRAW_PALETTE[0]);
  const [brush, setBrush] = useState<BrushSize>(1);
  const [kind, setKind] = useState<CreatureKind>(init.kind ?? 'fish');
  const [name, setName] = useState(init.name ?? '');
  const [message, setMessage] = useState(init.message ?? '');

  const paintCell = useCallback(
    (index: number) => {
      const col = index % CANVAS.width;
      const row = Math.floor(index / CANVAS.width);

      if (tool === 'eyedropper') {
        const picked = pixels[index];
        if (picked) {
          setColor(picked);
          setTool('brush');
        }
        return;
      }

      const value = tool === 'eraser' ? null : color;
      setPixels((prev) => {
        const next = [...prev];
        for (const dx of footprint(brush)) {
          for (const dy of footprint(brush)) {
            const c = col + dx;
            const r = row + dy;
            if (c < 0 || c >= CANVAS.width || r < 0 || r >= CANVAS.height) continue;
            next[r * CANVAS.width + c] = value;
          }
        }
        return next;
      });
    },
    [tool, pixels, color, brush],
  );

  /**
   * 획 시작 시점에 현재 상태를 히스토리에 넣는다.
   * 셀 하나하나가 아니라 **획 단위**로 되돌려야 사용자가 기대하는 undo가 된다.
   */
  const beginStroke = useCallback(() => {
    setPast((prev) => [...prev, pixels].slice(-HISTORY_LIMIT));
    setFuture([]);
  }, [pixels]);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setFuture((f) => [pixels, ...f].slice(0, HISTORY_LIMIT));
      setPixels(snapshot);
      return prev.slice(0, -1);
    });
  }, [pixels]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[0];
      setPast((p) => [...p, pixels].slice(-HISTORY_LIMIT));
      setPixels(snapshot);
      return prev.slice(1);
    });
  }, [pixels]);

  /** 전체 지우기 — 되돌릴 수 있도록 히스토리에 남긴다. */
  const clear = useCallback(() => {
    setPast((prev) => [...prev, pixels].slice(-HISTORY_LIMIT));
    setFuture([]);
    setPixels(Array(CELL_COUNT).fill(null));
  }, [pixels]);
  const isEmpty = useMemo(() => pixels.every((p) => p === null), [pixels]);

  /** 저장/전송용 인코딩 문자열 (팔레트 + RLE). */
  const spriteCode = useMemo(
    () => encodeSprite(pixels, CANVAS.width, CANVAS.height),
    [pixels],
  );

  return {
    pixels,
    spriteCode,
    isEmpty,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    beginStroke,
    undo,
    redo,
    tool,
    color,
    brush,
    kind,
    name,
    message,
    setTool,
    setColor,
    setBrush,
    setKind,
    setName,
    setMessage,
    paintCell,
    clear,
  };
}

export type DrawingState = ReturnType<typeof useDrawing>;
