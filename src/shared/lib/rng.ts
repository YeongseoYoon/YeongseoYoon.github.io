/**
 * 시드 기반 결정적 난수 (mulberry32).
 * 밀도 배치가 리렌더마다 흔들리지 않도록 시드로 고정한다. (핸드오프 배치 스크립트 이식)
 */
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
