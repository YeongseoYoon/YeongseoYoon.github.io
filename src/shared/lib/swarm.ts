import { mulberry32 } from './rng';

/**
 * 밀도 배치 알고리즘 (PRD 9 화면 밀도 · 핸드오프 7·8 전체 보기).
 *
 * "N마리면 N마리가 표시 영역에 딱 맞게 배치된다" 규칙을 구현한다.
 * 격자 + 시드 난수 지터로 정렬돼 보이지 않게 흩뿌린다.
 *
 * 순수 함수: 같은 입력 → 같은 배치. 렌더링과 분리해 테스트/재사용이 쉽다.
 */

export interface SwarmArea {
  /** 표시 영역 (상태바·바닥 제외) */
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface SwarmPlacement {
  index: number;
  left: number;
  top: number;
  /** 개당 스케일 배율 */
  scale: number;
  /** 좌우 반전 (1 | -1) */
  flip: 1 | -1;
  /** 유영 애니메이션 지속/지연 (초) */
  duration: number;
  delay: number;
}

export interface SwarmOptions {
  count: number;
  area: SwarmArea;
  /** 밀도: 마릿수가 적으면 'big'(크게 여유), 많으면 'small'(작게 촘촘) */
  density: 'big' | 'small';
  /** 배치 시드 (구역별로 고정) */
  seed: number;
}

/** 밀도별 개당 스케일 범위. OCP: 밀도 단계를 늘리려면 이 맵만 확장한다. */
const SCALE_RANGE: Record<SwarmOptions['density'], { base: number; spread: number }> = {
  big: { base: 4.8, spread: 1.9 },
  small: { base: 1.7, spread: 0.9 },
};

export function layoutSwarm({ count, area, density, seed }: SwarmOptions): SwarmPlacement[] {
  if (count <= 0) return [];

  const rnd = mulberry32(seed);
  const cols = Math.ceil(Math.sqrt(count * (area.width / area.height)));
  const rows = Math.ceil(count / cols);
  const cellW = area.width / cols;
  const cellH = area.height / rows;
  const { base, spread } = SCALE_RANGE[density];

  const placements: SwarmPlacement[] = [];
  for (let i = 0; i < count; i += 1) {
    const scale = base + rnd() * spread;
    const col = i % cols;
    const row = Math.floor(i / cols);
    // 셀 내부에서 지터를 줘 자연스러운 무리 형성
    const left = Math.round(area.offsetX + col * cellW + Math.max(0, cellW * 0.4) * rnd());
    const top = Math.round(area.offsetY + row * cellH + Math.max(0, cellH * 0.4) * rnd());

    placements.push({
      index: i,
      left,
      top,
      scale,
      flip: rnd() < 0.5 ? 1 : -1,
      duration: Number((4 + rnd() * 3).toFixed(1)),
      delay: Number((rnd() * 3).toFixed(1)),
    });
  }
  return placements;
}
