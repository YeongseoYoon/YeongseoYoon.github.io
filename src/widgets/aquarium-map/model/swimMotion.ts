const MAX_FRAME_GAP_SECONDS = 0.2;
const MAX_STEP_SECONDS = 1 / 30;
const MIN_HORIZONTAL_SPEED = 14;
const MAX_HORIZONTAL_SPEED = 40;
const MAX_VERTICAL_SPEED = 20;

/** 탭이 오래 숨겨졌다면 복귀 프레임에서는 이동하지 않는다. */
export function frameDeltaSeconds(now: number, previous: number): number {
  const elapsed = Math.max(0, (now - previous) / 1000);
  if (elapsed > MAX_FRAME_GAP_SECONDS) return 0;
  return Math.min(MAX_STEP_SECONDS, elapsed);
}

/** 무작위 방향 전환이 누적돼도 속도가 계속 커지지 않게 정상 범위로 되돌린다. */
export function stabilizeSwimVelocity(vx: number, vy: number): { vx: number; vy: number } {
  const direction = vx < 0 ? -1 : 1;
  return {
    vx: direction * Math.min(MAX_HORIZONTAL_SPEED, Math.max(MIN_HORIZONTAL_SPEED, Math.abs(vx))),
    vy: Math.min(MAX_VERTICAL_SPEED, Math.max(-MAX_VERTICAL_SPEED, vy)),
  };
}
