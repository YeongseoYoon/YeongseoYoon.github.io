/**
 * 프리셋 스프라이트의 기준 비율(작은 단위). 배치 시 scale을 곱해 실제 px를 낸다.
 * 핸드오프 배치 스크립트의 종별 폭/높이 비율을 이식했다.
 */
const SPRITE_DIMENSIONS: Record<string, readonly [number, number]> = {
  clownfish: [14, 6],
  tang: [14, 6],
  lemon: [10, 6],
  puffer: [10, 7],
  minnow: [8, 5],
  turtle: [14, 5],
  seahorse: [6, 13],
  axolotl: [12, 8],
  jelly: [10, 9],
  crab: [12, 7],
  star: [9, 8],
  coral: [12, 9],
  weed: [8, 16],
  kelp: [8, 14],
};

const DEFAULT_DIMENSION: readonly [number, number] = [12, 7];

/** 사용자 픽셀 스프라이트(18×16 비율)와 프리셋 모두를 지원하는 기준 크기. */
export function spriteBaseSize(spriteKey: string | null): readonly [number, number] {
  if (!spriteKey) return [18, 16];
  return SPRITE_DIMENSIONS[spriteKey] ?? DEFAULT_DIMENSION;
}
