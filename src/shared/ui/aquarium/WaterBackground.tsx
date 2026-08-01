import type { ReactNode } from 'react';
import { cn } from '../../lib';

interface WaterBackgroundProps {
  children?: ReactNode;
  /** 큰 바다('sea') vs 작은 수조('tank') 그라디언트 */
  variant?: 'sea' | 'tank';
  className?: string;
}

/** 절차적 물 배경 — 빈 바다도 비어 보이지 않게 채우는 기반(PRD 제품원칙 1). */
export function WaterBackground({ children, variant = 'sea', className }: WaterBackgroundProps) {
  return (
    <div className={cn('absolute inset-0', variant === 'sea' ? 'water' : 'water-tank', className)}>
      {children}
    </div>
  );
}
