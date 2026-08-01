import { useEffect, useRef } from 'react';
import { CANVAS } from '@/shared/config';
import { assetUrl } from '@/shared/lib';
import { getGuideLayout } from '../model/guideLayout';

interface CanvasBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 마우스·손가락 좌표를 동일한 36×32 셀 인덱스로 변환한다. */
export function pointToCellIndex(clientX: number, clientY: number, bounds: CanvasBounds): number | null {
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;
  if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) return null;
  const col = Math.floor((x / bounds.width) * CANVAS.width);
  const row = Math.floor((y / bounds.height) * CANVAS.height);
  return row * CANVAS.width + col;
}

interface PixelCanvasProps {
  pixels: (string | null)[];
  onPaintCell: (index: number) => void;
  /** 획 시작 (되돌리기 단위) */
  onStrokeStart?: () => void;
  hint?: string;
  /** 참고용 밑그림 스프라이트 키 (assets/{key}.png). 따라 그리기 가이드. */
  guideSpriteKey?: string | null;
}

/**
 * 인터랙티브 픽셀 캔버스 (36×32).
 * 책임: 셀 렌더 + 포인터 드래그 → 셀 인덱스 변환. 무엇을 칠할지는 상위(useDrawing)가 정한다.
 */
export function PixelCanvas({ pixels, onPaintCell, onStrokeStart, hint, guideSpriteKey }: PixelCanvasProps) {
  const drawing = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const lastPaintedCell = useRef<number | null>(null);
  const guideLayout = guideSpriteKey ? getGuideLayout(guideSpriteKey) : null;

  // 캔버스 밖에서 손을 떼도 드로잉이 멈추도록 전역 pointerup 구독.
  useEffect(() => {
    const stop = () => {
      drawing.current = false;
      activePointer.current = null;
      lastPaintedCell.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  return (
    <div
      className="checker relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-black/10"
      style={{
        aspectRatio: `${CANVAS.width} / ${CANVAS.height}`,
        // 체크 한 타일은 2×2셀이다. 백분율로 계산해 어떤 화면 폭에서도 실제 격자와 함께 축소·확대한다.
        backgroundSize: `${(2 / CANVAS.width) * 100}% ${(2 / CANVAS.height) * 100}%`,
      }}
    >
      {guideSpriteKey && guideLayout && (
        <img
          src={assetUrl(`${guideSpriteKey}.png`)}
          alt=""
          aria-hidden
          className="pixel pointer-events-none absolute opacity-20"
          style={{
            left: `${(guideLayout.left / CANVAS.width) * 100}%`,
            top: `${(guideLayout.top / CANVAS.height) * 100}%`,
            width: `${(guideLayout.width / CANVAS.width) * 100}%`,
            height: `${(guideLayout.height / CANVAS.height) * 100}%`,
          }}
        />
      )}
      <div
        ref={surfaceRef}
        className="relative h-full w-full touch-none"
        onPointerMove={(event) => {
          if (!drawing.current || activePointer.current !== event.pointerId) return;
          event.preventDefault();
          const index = pointToCellIndex(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
          if (index === null || index === lastPaintedCell.current) return;
          lastPaintedCell.current = index;
          onPaintCell(index);
        }}
        onPointerUp={() => {
          drawing.current = false;
          activePointer.current = null;
          lastPaintedCell.current = null;
        }}
        onPointerCancel={() => {
          drawing.current = false;
          activePointer.current = null;
          lastPaintedCell.current = null;
        }}
      >
        {pixels.map((color, i) => {
          const col = i % CANVAS.width;
          const row = Math.floor(i / CANVAS.width);
          return (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-label={`픽셀 ${i}`}
              className="absolute border-[0.5px] border-black/[.06]"
              style={{
                left: `${(col / CANVAS.width) * 100}%`,
                top: `${(row / CANVAS.height) * 100}%`,
                width: `${100 / CANVAS.width}%`,
                height: `${100 / CANVAS.height}%`,
                backgroundColor: color ?? 'transparent',
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                drawing.current = true;
                activePointer.current = e.pointerId;
                lastPaintedCell.current = i;
                surfaceRef.current?.setPointerCapture?.(e.pointerId);
                onStrokeStart?.();
                onPaintCell(i);
              }}
            />
          );
        })}
      </div>
      <span className="pointer-events-none absolute left-3 top-2.5 rounded-md bg-white/85 px-1.5 py-[3px] text-[11px] font-semibold text-ink-faint">
        {CANVAS.width}×{CANVAS.height}
      </span>
      {hint && (
        <span className="pointer-events-none absolute right-3 top-2.5 rounded-md bg-brand-bg px-1.5 py-[3px] text-[11px] font-semibold text-sea-mid">
          {hint}
        </span>
      )}
    </div>
  );
}
