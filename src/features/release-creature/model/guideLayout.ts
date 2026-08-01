import { CANVAS } from '@/shared/config';
import type { CreatureKind } from '@/entities/creature';

export interface GuideOption {
  key: string;
  label: string;
  dimensions: readonly [number, number];
}

export const GUIDE_OPTIONS_BY_KIND: Record<CreatureKind, readonly GuideOption[]> = {
  fish: [
    { key: 'clownfish', label: '흰동가리', dimensions: [14, 6] },
    { key: 'tang', label: '블루탱', dimensions: [14, 6] },
    { key: 'lemon', label: '노랑물고기', dimensions: [10, 6] },
    { key: 'puffer', label: '복어', dimensions: [10, 7] },
    { key: 'minnow', label: '꼬마물고기', dimensions: [8, 5] },
    { key: 'jelly', label: '해파리', dimensions: [10, 9] },
    { key: 'crab', label: '게', dimensions: [12, 7] },
    { key: 'turtle', label: '거북', dimensions: [14, 5] },
    { key: 'seahorse', label: '해마', dimensions: [6, 13] },
    { key: 'axolotl', label: '우파루파', dimensions: [12, 8] },
  ],
  seaweed: [
    { key: 'weed', label: '해초', dimensions: [6, 12] },
    { key: 'kelp', label: '다시마', dimensions: [6, 10] },
  ],
  decoration: [
    { key: 'star', label: '불가사리', dimensions: [9, 8] },
    { key: 'coral', label: '산호', dimensions: [10, 8] },
  ],
};

const GUIDE_DIMENSIONS = Object.fromEntries(
  Object.values(GUIDE_OPTIONS_BY_KIND).flat().map((option) => [option.key, option.dimensions]),
) as Record<string, readonly [number, number]>;

const GUIDE_SCALE = 2;

export interface GuideLayout {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 원본 픽셀을 2배 정수 확대해 36×32 셀 한가운데 놓는다.
 * 위치와 크기가 모두 셀 단위 정수라 밑그림 픽셀 경계가 격자선과 정확히 겹친다.
 */
export function getGuideLayout(spriteKey: string): GuideLayout | null {
  const source = GUIDE_DIMENSIONS[spriteKey];
  if (!source) return null;
  const width = source[0] * GUIDE_SCALE;
  const height = source[1] * GUIDE_SCALE;
  return {
    left: (CANVAS.width - width) / 2,
    top: (CANVAS.height - height) / 2,
    width,
    height,
  };
}
