import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../rng';

describe('시드 난수', () => {
  it('TC-9-3 같은 시드는 같은 수열을 만든다 (배치 재현성)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('다른 시드는 다른 수열을 만든다', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});
