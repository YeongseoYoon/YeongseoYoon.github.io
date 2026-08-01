import { describe, expect, it } from 'vitest';
import { displayName } from '../model/lib';

describe('사용자 표시 이름', () => {
  it('TC-9-6 무명 사용자는 기본 이름으로 표시된다', () => {
    expect(displayName({ nickname: null })).toBe('이름 없는 탐험가');
    expect(displayName({ nickname: '   ' })).toBe('이름 없는 탐험가');
  });

  it('닉네임이 있으면 그대로 쓴다', () => {
    expect(displayName({ nickname: '말미잘' })).toBe('말미잘');
  });
});
