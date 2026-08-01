import { DRAW_PALETTE } from '@/shared/config';
import { cn } from '@/shared/lib';

interface PaletteProps {
  color: string;
  onSelect: (color: string) => void;
}

/**
 * 색상 팔레트. 자주 쓰는 12색 프리셋 + 브라우저 컬러피커로 임의의 색을 고를 수 있다.
 * (프리셋으로 톤을 유지하되, 원하면 더 많은 색을 쓸 수 있게 확장 — 사용자 요청)
 */
export function Palette({ color, onSelect }: PaletteProps) {
  const isPreset = DRAW_PALETTE.some((c) => c.toLowerCase() === color.toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DRAW_PALETTE.map((c) => {
        const selected = c.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`색상 ${c}`}
            onClick={() => onSelect(c)}
            className={cn(
              'h-6 w-6 rounded-md',
              c === '#ffffff' && 'border border-black/15',
              selected && 'outline outline-2 outline-offset-2 outline-ink',
            )}
            style={{ backgroundColor: c }}
          />
        );
      })}

      {/* 커스텀 색: 네이티브 컬러피커 */}
      <label
        className={cn(
          'relative grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-md border border-black/15',
          !isPreset && 'outline outline-2 outline-offset-2 outline-ink',
        )}
        style={{
          background: isPreset
            ? 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)'
            : color,
        }}
        title="색 직접 고르기"
        aria-label="색 직접 고르기"
      >
        <input
          type="color"
          value={isPreset ? '#000000' : color}
          onChange={(e) => onSelect(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {isPreset && <span className="pointer-events-none text-[11px] font-bold text-white [text-shadow:0_0_2px_rgba(0,0,0,.6)]">+</span>}
      </label>
    </div>
  );
}
