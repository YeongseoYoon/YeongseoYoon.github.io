import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { cn, assetUrl } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import type { GuideOption } from '../model/guideLayout';

interface GuidePickerProps {
  options: readonly GuideOption[];
  value: string;
  onChange: (key: string) => void;
}

/** 종류별 밑그림을 미리 보고 고르는 가로 스크롤 목록. */
export function GuidePicker({ options, value, onChange }: GuidePickerProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateEdges = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 2);
    setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 2);
  }, []);

  useLayoutEffect(() => {
    updateEdges();
    const element = scroller.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    return () => observer.disconnect();
  }, [options, updateEdges]);

  function scroll(direction: -1 | 1) {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({ left: direction * Math.max(180, element.clientWidth * 0.72), behavior: 'smooth' });
  }

  return (
    <div className="relative mb-2 min-w-0">
      <div
        ref={scroller}
        role="radiogroup"
        aria-label="밑그림 선택"
        onScroll={updateEdges}
        onPointerDown={(event) => {
          // 터치는 브라우저의 관성 스크롤을 그대로 사용한다. 커스텀 드래그는 마우스용이다.
          if (event.pointerType === 'touch') return;
          if (event.button !== 0 || !scroller.current) return;
          drag.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScroll: scroller.current.scrollLeft,
            moved: false,
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!scroller.current || drag.current.pointerId !== event.pointerId) return;
          const distance = event.clientX - drag.current.startX;
          if (Math.abs(distance) > 5) drag.current.moved = true;
          if (drag.current.moved) {
            scroller.current.scrollLeft = drag.current.startScroll - distance;
            updateEdges();
          }
        }}
        onPointerUp={(event) => {
          if (drag.current.pointerId !== event.pointerId) return;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
          drag.current.pointerId = -1;
        }}
        onPointerCancel={() => {
          drag.current.pointerId = -1;
          drag.current.moved = false;
        }}
        onClickCapture={(event) => {
          if (!drag.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }}
        onWheel={(event) => {
          if (!scroller.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          scroller.current.scrollLeft += event.deltaY;
        }}
        className={cn(
          'flex w-full min-w-0 cursor-grab snap-x snap-proximity touch-pan-x select-none gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 pr-10 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden',
        )}
      >
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.key)}
              className={cn(
                'flex h-[54px] min-w-[64px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 [scroll-snap-stop:always]',
                active
                  ? 'border-[1.5px] border-brand bg-brand-bg text-brand-accessible'
                  : 'border border-black/10 bg-white text-ink-sub',
              )}
            >
              <img
                src={assetUrl(`${option.key}.png`)}
                alt=""
                aria-hidden
                className="pixel h-7 max-w-10 object-contain"
              />
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none">{option.label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="이전 밑그림 보기"
        onClick={() => scroll(-1)}
        disabled={!canScrollLeft}
        className="absolute left-0 top-0 grid h-[54px] w-9 place-items-center rounded-xl border border-black/10 bg-white/95 text-ink-sub shadow-[10px_0_16px_rgba(255,255,255,.95)] disabled:pointer-events-none disabled:opacity-0"
      >
        <Icon name="chevron-left" size={18} />
      </button>
      <button
        type="button"
        aria-label="다음 밑그림 보기"
        onClick={() => scroll(1)}
        disabled={!canScrollRight}
        className="absolute right-0 top-0 grid h-[54px] w-9 place-items-center rounded-xl border border-black/10 bg-white/95 text-ink-sub shadow-[-10px_0_16px_rgba(255,255,255,.95)] disabled:pointer-events-none disabled:opacity-0"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  );
}
