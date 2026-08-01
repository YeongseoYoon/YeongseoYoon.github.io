import { useEffect, useRef } from 'react';
import { CANVAS } from '@/shared/config';
import { assetUrl } from '@/shared/lib';
import { getGuideLayout } from '../model/guideLayout';

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
  const guideLayout = guideSpriteKey ? getGuideLayout(guideSpriteKey) : null;

  // 캔버스 밖에서 손을 떼도 드로잉이 멈추도록 전역 pointerup 구독.
  useEffect(() => {
    const stop = () => {
      drawing.current = false;
    };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  return (
    <div
      className="checker relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-black/10"
      style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
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
        className="grid h-full w-full touch-none"
        style={{
          gridTemplateColumns: `repeat(${CANVAS.width}, 1fr)`,
          gridTemplateRows: `repeat(${CANVAS.height}, 1fr)`,
        }}
      >
        {pixels.map((color, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            aria-label={`픽셀 ${i}`}
            className="border-[0.5px] border-black/[.06]"
            style={{ backgroundColor: color ?? 'transparent' }}
            onPointerDown={(e) => {
              e.preventDefault();
              drawing.current = true;
              onStrokeStart?.();
              onPaintCell(i);
            }}
            onPointerEnter={() => {
              if (drawing.current) onPaintCell(i);
            }}
          />
        ))}
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
