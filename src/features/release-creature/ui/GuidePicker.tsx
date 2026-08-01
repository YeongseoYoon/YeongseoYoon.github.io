import { useRef } from 'react';
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

  function scroll(direction: -1 | 1) {
    scroller.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  }

  return (
    <div className="relative mb-2 min-w-0">
      <div
        ref={scroller}
        role="radiogroup"
        aria-label="밑그림 선택"
        onWheel={(event) => {
          if (!scroller.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          scroller.current.scrollLeft += event.deltaY;
        }}
        className="flex w-full min-w-0 touch-pan-x gap-1.5 overflow-x-auto overscroll-x-contain pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                'flex h-[54px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2',
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
        aria-label="다음 밑그림 보기"
        onClick={() => scroll(1)}
        className="absolute right-0 top-0 grid h-[54px] w-9 place-items-center rounded-xl border border-black/10 bg-white/95 text-ink-sub shadow-[-10px_0_16px_rgba(255,255,255,.95)]"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </div>
  );
}
