import type { ReactNode } from 'react';
import { cn } from '../lib';

export type BadgeTone = 'brand' | 'secondary' | 'positive' | 'negative' | 'warning' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  brand: 'bg-brand-bg text-brand-accessible',
  secondary: 'bg-secondary-bg text-secondary-accessible',
  positive: 'bg-positive-bg text-positive-accessible',
  negative: 'bg-negative-bg text-negative-accessible',
  warning: 'bg-warning-bg text-warning-accessible',
  neutral: 'bg-black/[.05] text-ink-sub',
};

/** 상태/종류 라벨 pill. 색 결정은 tone 하나로만 좌우된다(예측 가능성). */
export function Badge({ tone = 'brand', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full px-1.5 text-xs font-semibold',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
