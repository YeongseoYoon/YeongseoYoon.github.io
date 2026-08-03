import { describe, expect, it } from 'vitest';
import { authCallbackUrl, safeNextPath } from './auth';

describe('계정 연결 콜백', () => {
  it('내부 경로만 로그인 이후 이동 경로로 허용한다', () => {
    expect(safeNextPath('/my-tank')).toBe('/my-tank');
    expect(safeNextPath('//attacker.example')).toBe('/my-tank');
    expect(safeNextPath('https://attacker.example')).toBe('/my-tank');
    expect(safeNextPath(null)).toBe('/my-tank');
  });

  it('현재 서비스 origin의 콜백 주소를 만든다', () => {
    const url = new URL(authCallbackUrl('/my-tank'));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe('/auth/callback');
    expect(url.searchParams.get('next')).toBe('/my-tank');
  });
});
