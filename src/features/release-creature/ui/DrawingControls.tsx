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
  onDraft?: () => void;
  draftDisabled?: boolean;
  draftBusy?: boolean;
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
  onDraft,
  draftDisabled = false,
  draftBusy = false,
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
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Palette
            color={color}
            onSelect={(nextColor) => {
              onColor(nextColor);
              onTool('brush');
            }}
          />
        </div>
        {onDraft && (
          <button
            type="button"
            onClick={onDraft}
            disabled={draftDisabled}
            className="h-[54px] min-w-[64px] shrink-0 rounded-xl border border-black/10 bg-white px-2 text-[11px] font-bold leading-tight text-ink-sub shadow-sm disabled:opacity-35"
          >
            {draftBusy ? '저장 중…' : '임시저장'}
          </button>
        )}
      </div>
    </section>
  );
}
