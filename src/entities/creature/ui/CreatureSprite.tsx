import { useMemo } from 'react';
import { assetUrl, cn, spriteToDataUrl } from '@/shared/lib';
import type { Creature, MotionKind } from '../model/types';

interface CreatureSpriteProps {
  /** 렌더에 필요한 최소 정보만 받는다(ISP). */
  creature: Pick<Creature, 'name' | 'motion' | 'sprite' | 'spriteKey'>;
  width: number;
  height: number;
  flip?: boolean;
  animate?: boolean;
  delay?: number;
  duration?: number;
  shadow?: boolean;
  className?: string;
}

/** 움직임 종류 → Tailwind 애니메이션. still은 애니메이션 없음. */
const MOTION_ANIMATION: Record<MotionKind, string> = {
  swim: 'animate-swimBob',
  sway: 'animate-weedSway origin-bottom',
  float: 'animate-jellyFloat',
  still: '',
};

/**
 * 생물 하나의 시각 표현.
 * 사용자 그림은 캔버스로 구운 data URL을 <img> 하나로 렌더한다(노드 1개).
 * 위치는 부모가 정한다 → 배치와 표현을 분리.
 */
export function CreatureSprite({
  creature,
  width,
  height,
  flip = false,
  animate = true,
  delay = 0,
  duration,
  shadow = true,
  className,
}: CreatureSpriteProps) {
  const src = useMemo(() => {
    if (creature.sprite) return spriteToDataUrl(creature.sprite);
    return assetUrl(`${creature.spriteKey ?? 'clownfish'}.png`);
  }, [creature.sprite, creature.spriteKey]);

  if (!src) return null;

  return (
    <div
      className={cn(animate ? MOTION_ANIMATION[creature.motion] : '', className)}
      style={{
        transform: flip ? 'scaleX(-1)' : undefined,
        animationDelay: delay ? `${delay}s` : undefined,
        animationDuration: duration ? `${duration}s` : undefined,
        filter: shadow ? 'drop-shadow(0 8px 10px rgba(9,62,70,.28))' : undefined,
      }}
    >
      <img
        src={src}
        width={width}
        height={height}
        className="pixel"
        alt={creature.name}
        draggable={false}
      />
    </div>
  );
}
