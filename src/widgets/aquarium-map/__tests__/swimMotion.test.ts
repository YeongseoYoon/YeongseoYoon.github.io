import { describe, expect, it } from 'vitest';
import { frameDeltaSeconds, stabilizeSwimVelocity } from '../model/swimMotion';

describe('수족관 헤엄 시간과 속도', () => {
  it('숨겨진 탭으로 오래 있다가 돌아온 첫 프레임은 이동량을 만들지 않는다', () => {
    expect(frameDeltaSeconds(10_000, 1_000)).toBe(0);
  });

  it('일반 프레임 간격은 큰 프레임에서도 30fps 이동량까지만 허용한다', () => {
    expect(frameDeltaSeconds(1_050, 1_000)).toBeCloseTo(1 / 30);
  });

  it('반복 가속으로 커진 속도를 최대 범위 안으로 제한한다', () => {
    expect(stabilizeSwimVelocity(500, -200)).toEqual({ vx: 40, vy: -20 });
    expect(stabilizeSwimVelocity(-2, 3)).toEqual({ vx: -14, vy: 3 });
  });
});
