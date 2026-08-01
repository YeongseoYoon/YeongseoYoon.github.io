import type { BrushSize } from '@/shared/config';
import { cn } from '@/shared/lib';
import type { DrawTool } from '../model/useDrawing';
import { DrawToolbar } from './DrawToolbar';
import { Palette } from './Palette';

interface DrawingControlsProps {
  variant: 'mobile' | 'desktop';
  tool: DrawTool;
  brush: BrushSize;
  color: string;
  onBrush: (size: BrushSize) => void;
  onTool: (tool: DrawTool) => void;
  onColor: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * 캔버스 도구 묶음. 모바일에서는 캔버스 앞에 놓이고 스크롤 영역 상단에 붙어
 * 캔버스의 한 손가락 드래그를 그리기에 그대로 예약하면서도 항상 접근할 수 있다.
 */
export function DrawingControls({
  variant,
  tool,
  brush,
  color,
  onBrush,
  onTool,
  onColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: DrawingControlsProps) {
  const mobile = variant === 'mobile';

  return (
    <section
      aria-label={mobile ? '모바일 그리기 도구' : '데스크톱 그리기 도구'}
      data-testid={`${variant}-drawing-controls`}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-black/[.07] p-3',
        mobile
          ? 'sticky top-0 z-20 mb-3 bg-white/95 shadow-[0_8px_24px_rgba(23,68,76,.12)] backdrop-blur lg:hidden'
          : 'mt-3 hidden bg-[#fafbfb] lg:flex',
      )}
    >
      <DrawToolbar
        tool={tool}
        brush={brush}
        onBrush={onBrush}
        onTool={onTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <Palette
        color={color}
        onSelect={(nextColor) => {
          onColor(nextColor);
          onTool('brush');
        }}
      />
    </section>
  );
}
