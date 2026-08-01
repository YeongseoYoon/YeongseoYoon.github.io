import { CANVAS } from '@/shared/config';

const GUIDE_DIMENSIONS: Record<string, readonly [number, number]> = {
  clownfish: [14, 6],
  weed: [6, 12],
  star: [9, 8],
};

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
