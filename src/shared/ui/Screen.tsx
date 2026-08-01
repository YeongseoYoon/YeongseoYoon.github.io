import type { ReactNode } from 'react';
import { cn } from '../lib';

interface ScreenProps {
  children: ReactNode;
  /**
   * full   — 화면 전체를 채운다 (탐험 지도처럼 넓을수록 좋은 화면)
   * content— 읽고 조작하는 화면. 넓은 화면에서는 가운데 정렬 + 최대 폭 제한.
   */
  variant?: 'full' | 'content';
  className?: string;
}

/**
 * 반응형 화면 셸 (모바일 퍼스트).
 * 고정 폰 프레임(390×844) 대신 뷰포트를 그대로 채우고, 넓은 화면에서만 폭을 제한한다.
 * `relative`는 바텀시트·모달(absolute inset-0)의 기준이 된다.
 */
export function Screen({ children, variant = 'full', className }: ScreenProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        variant === 'content' &&
          'mx-auto max-w-2xl sm:my-0 sm:border-x sm:border-black/[.06] sm:shadow-[0_0_60px_rgba(23,68,76,.10)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
