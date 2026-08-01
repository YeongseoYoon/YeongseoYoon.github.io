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

const BRUSH_LABEL: Record<BrushSize, string> = {
  1: '얇게',
  2: '보통',
  3: '굵게',
};

/** 브러시 굵기와 도구 이름을 아이콘 아래에 함께 표시한다. */
export function DrawToolbar({ tool, brush, onBrush, onTool, canUndo, canRedo, onUndo, onRedo }: DrawToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-1">
        {BRUSH_SIZES.map((size) => {
          const active = tool === 'brush' && brush === size;
          return (
            <button
              key={size}
              type="button"
              aria-label={`${BRUSH_LABEL[size]} 브러시`}
              aria-pressed={active}
              onClick={() => {
                onBrush(size);
                onTool('brush');
              }}
              className={cn(
                'flex h-12 w-10 flex-col items-center justify-center gap-1 rounded-[10px]',
                active ? 'border-[1.5px] border-brand bg-brand-bg' : 'border border-black/15 bg-white',
              )}
            >
              <i
                className={cn('rounded-full', active ? 'bg-sea-deep' : 'bg-ink-faint')}
                style={{ width: 3 + size * 3, height: 3 + size * 3 }}
              />
              <span className="text-[9px] font-semibold leading-none text-ink-sub">{BRUSH_LABEL[size]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        {/* 점 단위 지우개 — '전체 지우기'와 구분되도록 지우개 아이콘 사용 */}
        <ToolButton label="지우개" active={tool === 'eraser'} onClick={() => onTool('eraser')}>
          <Icon name="eraser" size={16} />
        </ToolButton>
        <ToolButton label="되돌림" active={false} disabled={!canUndo} onClick={onUndo}>
          <Icon name="undo" size={16} />
        </ToolButton>
        <ToolButton label="다시" active={false} disabled={!canRedo} onClick={onRedo}>
          <Icon name="redo" size={16} />
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
        'flex h-12 w-10 flex-col items-center justify-center gap-1 rounded-[10px]',
        active ? 'border-[1.5px] border-brand bg-brand-bg text-sea-deep' : 'border border-black/15 bg-white text-ink-sub',
        disabled && 'opacity-35',
      )}
    >
      {children}
      <span className="text-[9px] font-semibold leading-none">{label}</span>
    </button>
  );
}
