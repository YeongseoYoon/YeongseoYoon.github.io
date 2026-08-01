import { describe, expect, it } from 'vitest';
import {
  canTransition,
  isPubliclyVisible,
  isVisibleToOwner,
} from '../model/status';

describe('작품 상태 머신', () => {
  it('TC-3-1/2 공개 ↔ 숨김 전이가 가능하다', () => {
    expect(canTransition('published', 'hidden')).toBe(true);
    expect(canTransition('hidden', 'published')).toBe(true);
  });

  it('TC-3-3 deleted는 종착 상태다', () => {
    expect(canTransition('deleted', 'published')).toBe(false);
    expect(canTransition('deleted', 'hidden')).toBe(false);
  });

  it('TC-3-4 같은 상태로의 전이는 막는다', () => {
    expect(canTransition('published', 'published')).toBe(false);
  });

  it('TC-3-5 공개적으로 보이는 상태는 published뿐이다', () => {
    expect(isPubliclyVisible('published')).toBe(true);
    (['draft', 'pending', 'hidden', 'rejected', 'deleted'] as const).forEach((s) =>
      expect(isPubliclyVisible(s)).toBe(false),
    );
  });

  it('TC-3-6 창작자에게는 deleted만 숨긴다', () => {
    expect(isVisibleToOwner('hidden')).toBe(true);
    expect(isVisibleToOwner('deleted')).toBe(false);
  });
});
