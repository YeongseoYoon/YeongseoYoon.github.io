import { CreatureSprite, motionForKind, type CreatureKind } from '@/entities/creature';
import { cn } from '@/shared/lib';

interface MiniTankPreviewProps {
  /** 인코딩된 스프라이트 문자열 */
  sprite: string;
  kind: CreatureKind;
  name?: string;
  empty?: boolean;
  className?: string;
  caption?: string;
}

/** 내 수조 미리보기 — 실제 움직임을 제출 전에 보여준다 (PRD 7.1). */
export function MiniTankPreview({ sprite, kind, name, empty, className, caption }: MiniTankPreviewProps) {
  return (
    <div className={cn('water-tank relative overflow-hidden rounded-xl', className)}>
      {!empty && (
        <div className="absolute inset-0 grid place-items-center">
          <CreatureSprite
            creature={{ name: name ?? '내 생물', motion: motionForKind(kind), sprite, spriteKey: null }}
            width={56}
            height={50}
          />
        </div>
      )}
      {caption && (
        <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold text-white/95">
          {caption}
        </span>
      )}
    </div>
  );
}
