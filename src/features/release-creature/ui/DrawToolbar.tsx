import { BRUSH_SIZES, type BrushSize } from '@/shared/config';
import { Icon } from '@/shared/ui';
import { cn } from '@/shared/lib';
import type { DrawTool } from '../model/useDrawing';

interface DrawToolbarProps {
  tool: DrawTool;
  brush: BrushSize;
  onBrush: (size: BrushSize) => void;
  onTool: (tool: DrawTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

/** 브러시 굵기 3종 + 스포이드/지우개. */
export function DrawToolbar({ tool, brush, onBrush, onTool, canUndo, canRedo, onUndo, onRedo }: DrawToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        {BRUSH_SIZES.map((size) => {
          const active = tool === 'brush' && brush === size;
          return (
            <button
              key={size}
              type="button"
              aria-label={`브러시 ${size}`}
              onClick={() => {
                onBrush(size);
                onTool('brush');
              }}
              className={cn(
                'grid h-[38px] w-[38px] place-items-center rounded-[10px]',
                active ? 'border-[1.5px] border-brand bg-brand-bg' : 'border border-black/15 bg-white',
              )}
            >
              <i
                className={cn('rounded-full', active ? 'bg-sea-deep' : 'bg-ink-faint')}
                style={{ width: 3 + size * 3, height: 3 + size * 3 }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        <ToolButton label="스포이드" active={tool === 'eyedropper'} onClick={() => onTool('eyedropper')}>
          <Icon name="edit" size={17} />
        </ToolButton>
        {/* 점 단위 지우개 — '전체 지우기'와 구분되도록 지우개 아이콘 사용 */}
        <ToolButton label="지우개" active={tool === 'eraser'} onClick={() => onTool('eraser')}>
          <Icon name="eraser" size={17} />
        </ToolButton>
        <ToolButton label="되돌리기" active={false} disabled={!canUndo} onClick={onUndo}>
          <Icon name="undo" size={17} />
        </ToolButton>
        <ToolButton label="다시 실행" active={false} disabled={!canRedo} onClick={onRedo}>
          <Icon name="redo" size={17} />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-[38px] w-[38px] place-items-center rounded-[10px]',
        active ? 'border-[1.5px] border-brand bg-brand-bg text-sea-deep' : 'border border-black/15 bg-white text-ink-sub',
        disabled && 'opacity-35',
      )}
    >
      {children}
    </button>
  );
}
