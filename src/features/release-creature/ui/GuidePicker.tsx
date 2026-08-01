import { cn, assetUrl } from '@/shared/lib';
import type { GuideOption } from '../model/guideLayout';

interface GuidePickerProps {
  options: readonly GuideOption[];
  value: string;
  onChange: (key: string) => void;
}

/** 종류별 밑그림을 미리 보고 고르는 가로 스크롤 목록. */
export function GuidePicker({ options, value, onChange }: GuidePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="밑그림 선택"
      className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
  );
}
