import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionContext, type SessionValue } from '@/entities/session/model/context';
import { AccountStatusCard } from '../ui/AccountStatusCard';

function session(overrides: Partial<SessionValue> = {}): SessionValue {
  return {
    user: null,
    loading: false,
    error: null,
    isAdmin: false,
    inToss: false,
    isAnonymous: true,
    accountEmail: null,
    refreshAccount: async () => undefined,
    unlockAdmin: async () => false,
    lockAdmin: () => undefined,
    ...overrides,
  };
}

describe('내 수조 계정 상태', () => {
  it('익명 사용자는 보관과 불러오기를 명확히 선택할 수 있다', () => {
    const onOpen = vi.fn();
    render(
      <SessionContext.Provider value={session()}>
        <AccountStatusCard onOpen={onOpen} />
      </SessionContext.Provider>,
    );

    expect(screen.getByText('이 수조는 이 브라우저에만 저장돼요')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '내 수조 보관하기' }));
    fireEvent.click(screen.getByRole('button', { name: '기존 수조 불러오기' }));
    expect(onOpen).toHaveBeenNthCalledWith(1, 'preserve');
    expect(onOpen).toHaveBeenNthCalledWith(2, 'restore');
  });

  it('로그인 사용자는 여러 기기 관리 상태와 계정을 확인한다', () => {
    render(
      <SessionContext.Provider value={session({ isAnonymous: false, accountEmail: 'coral@example.com' })}>
        <AccountStatusCard onOpen={() => undefined} />
      </SessionContext.Provider>,
    );

    expect(screen.getByText('어디서든 관리 중')).toBeTruthy();
    expect(screen.getByText('coral@example.com')).toBeTruthy();
  });
});
