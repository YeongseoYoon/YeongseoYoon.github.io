import { cn } from '../../lib';

interface SandFloorProps {
  height?: number;
  className?: string;
}

/** 모래 바닥. 곡선 border-radius로 바닥의 굴곡을 표현한다. */
export function SandFloor({ height = 128, className }: SandFloorProps) {
  return (
    <div
      className={cn('sand-floor absolute bottom-0 -inset-x-5', className)}
      style={{
        height,
        borderRadius: '48% 60% 0 0/26px 34px 0 0',
        boxShadow: 'inset 0 6px 10px rgba(255,255,255,.5)',
      }}
    />
  );
}
