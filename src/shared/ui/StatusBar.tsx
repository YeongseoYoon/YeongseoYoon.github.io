import { cn } from '../lib';

interface StatusBarProps {
  /** 텍스트/아이콘 색. 물 위에서는 sea.deep, 흰 배경에서는 ink. */
  tone?: 'dark' | 'light' | 'ink';
  time?: string;
  /** 물 위 오버레이(absolute) 대신 일반 흐름(relative)으로 배치 — 흰 배경 화면용. */
  inFlow?: boolean;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<StatusBarProps['tone']>, string> = {
  dark: 'text-sea-deep [--bar:#0b3f46]',
  light: 'text-[#eaf7f9] [--bar:#eaf7f9]',
  ink: 'text-ink [--bar:#23242a]',
};

/** iOS 스타일 상태바 (목업 재현용). */
export function StatusBar({ tone = 'dark', time = '9:41', inFlow, className }: StatusBarProps) {
  return (
    <div
      className={cn(
        'z-10 flex h-12 items-center justify-between px-[26px]',
        inFlow ? 'relative shrink-0' : 'absolute inset-x-0 top-0',
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="text-[15px] font-semibold">{time}</span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-end gap-0.5">
          <i className="h-1 w-[3px] rounded-sm bg-[var(--bar)]" />
          <i className="h-1.5 w-[3px] rounded-sm bg-[var(--bar)]" />
          <i className="h-2 w-[3px] rounded-sm bg-[var(--bar)]" />
          <i className="h-2.5 w-[3px] rounded-sm bg-[var(--bar)]" />
        </span>
        <span className="relative inline-block h-[11px] w-[23px] rounded-[3.5px] border-[1.5px] border-[var(--bar)]">
          <i className="absolute inset-[1.5px] right-[5px] rounded-[1.5px] bg-[var(--bar)]" />
        </span>
      </div>
    </div>
  );
}
