import { cn } from '../lib';

interface ToastProps {
  children: string;
  className?: string;
}

/** 하단 상태 토스트 (전체 보기 안내 등). */
export function Toast({ children, className }: ToastProps) {
  return (
    <div className={cn('absolute inset-x-0 bottom-8 z-10 flex justify-center', className)}>
      <span className="rounded-full bg-sea-deep/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
        {children}
      </span>
    </div>
  );
}
