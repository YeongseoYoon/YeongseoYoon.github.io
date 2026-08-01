import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** 우측 액션 (임시저장/설정 등) */
  action?: ReactNode;
}

/** 흰 배경 화면 공통 헤더 (뒤로 · 제목 · 액션). */
export function ScreenHeader({ title, onBack, action }: ScreenHeaderProps) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between px-4">
      <button className="p-2" onClick={onBack} aria-label="뒤로">
        {onBack ? <Icon name="chevron-left" size={22} className="text-ink" /> : <span className="w-[22px]" />}
      </button>
      <span className="text-base font-bold tracking-tight">{title}</span>
      <div className="min-w-[38px] text-right">{action}</div>
    </div>
  );
}
