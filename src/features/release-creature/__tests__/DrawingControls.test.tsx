import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DRAW_PALETTE } from '@/shared/config';
import { SessionContext, type SessionValue } from '@/entities/session/model/context';
import { DrawingControls } from '../ui/DrawingControls';
import { DrawReleaseForm } from '../ui/DrawReleaseForm';

function renderControls(overrides: Partial<React.ComponentProps<typeof DrawingControls>> = {}) {
  const props: React.ComponentProps<typeof DrawingControls> = {
    variant: 'mobile',
    tool: 'brush',
    brush: 1,
    color: DRAW_PALETTE[0],
    onBrush: vi.fn(),
    onTool: vi.fn(),
    onColor: vi.fn(),
    canUndo: true,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    ...overrides,
  };
  render(<DrawingControls {...props} />);
  return props;
}

describe('모바일 그리기 도구', () => {
  it('모바일 패널은 캔버스보다 먼저, 데스크톱 패널은 캔버스 다음에 배치된다', async () => {
    const session: SessionValue = {
      user: null,
      loading: false,
      error: null,
      isAdmin: false,
      inToss: false,
      unlockAdmin: async () => false,
      lockAdmin: () => undefined,
    };
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SessionContext.Provider value={session}>
          <DrawReleaseForm onReleased={() => undefined} />
        </SessionContext.Provider>
      </MemoryRouter>,
    );

    const mobile = await screen.findByTestId('mobile-drawing-controls');
    const canvas = screen.getByTestId('pixel-canvas');
    const desktop = screen.getByTestId('desktop-drawing-controls');

    expect(mobile.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(canvas.compareDocumentPosition(desktop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('스크롤해도 캔버스 위에 남는 모바일 전용 패널이다', () => {
    renderControls();
    const panel = screen.getByTestId('mobile-drawing-controls');

    expect(panel.className).toContain('sticky');
    expect(panel.className).toContain('top-0');
    expect(panel.className).toContain('lg:hidden');
  });

  it('지우개와 펜 색을 패널에서 바로 바꿀 수 있다', () => {
    const props = renderControls();
    screen.getByRole('button', { name: '지우개' }).click();
    screen.getByRole('button', { name: `색상 ${DRAW_PALETTE[1]}` }).click();

    expect(props.onTool).toHaveBeenCalledWith('eraser');
    expect(props.onColor).toHaveBeenCalledWith(DRAW_PALETTE[1]);
    expect(props.onTool).toHaveBeenLastCalledWith('brush');
  });

  it('지우개를 다시 누르면 펜으로 돌아가고 지우개 촉 두께만 변경한다', () => {
    const props = renderControls({ tool: 'eraser', brush: 2 });
    const selectedSize = screen.getByRole('button', { name: '보통 지우개' });
    expect(selectedSize.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('펜으로')).toBeTruthy();

    screen.getByRole('button', { name: '굵게 지우개' }).click();
    expect(props.onBrush).toHaveBeenCalledWith(3);
    expect(props.onTool).not.toHaveBeenCalled();

    screen.getByRole('button', { name: '지우개' }).click();
    expect(props.onTool).toHaveBeenCalledWith('brush');
  });
});
