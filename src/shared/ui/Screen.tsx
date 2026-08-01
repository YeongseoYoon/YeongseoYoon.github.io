import type { ReactNode } from 'react';
import { cn } from '../lib';

interface ScreenProps {
  children: ReactNode;
  /**
   * full   — 화면 전체를 채운다 (탐험 지도처럼 넓을수록 좋은 화면)
   * content— 폼처럼 집중이 필요한 화면. 넓은 화면에서 2xl 폭 제한.
   * wide   — 대시보드형 화면. 데스크톱에서는 6xl까지 확장해 다열로 재배치한다.
   */
  variant?: 'full' | 'content' | 'wide';
  className?: string;
}

/**
 * 반응형 화면 셸.
 * 고정 폰 프레임 대신 뷰포트를 채우고, 화면 목적에 맞는 최대 폭을 적용한다.
 * `relative`는 바텀시트·모달(absolute inset-0)의 기준이 된다.
 */
export function Screen({ children, variant = 'full', className }: ScreenProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        variant !== 'full' &&
          'mx-auto sm:my-0 sm:border-x sm:border-black/[.06] sm:shadow-[0_0_60px_rgba(23,68,76,.10)]',
        variant === 'content' && 'max-w-2xl',
        variant === 'wide' && 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
