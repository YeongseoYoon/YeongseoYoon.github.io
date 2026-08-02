import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GUIDE_OPTIONS_BY_KIND } from '../model/guideLayout';
import { GuidePicker } from '../ui/GuidePicker';

const options = GUIDE_OPTIONS_BY_KIND.fish.slice(0, 3);

function pointer(type: string, values: { pointerId: number; clientX: number; button?: number; pointerType?: string }) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: values.pointerId },
    clientX: { value: values.clientX },
    button: { value: values.button ?? 0 },
    pointerType: { value: values.pointerType ?? 'mouse' },
  });
  return event;
}

function scrollable(element: HTMLElement) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 160 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 600 });
  Object.defineProperty(element, 'scrollLeft', { configurable: true, value: 0, writable: true });
  Object.defineProperty(element, 'scrollBy', { configurable: true, value: vi.fn() });
}

describe('GuidePicker', () => {
  it('오른쪽으로 이동한 뒤 이전 버튼으로 돌아갈 수 있다', () => {
    render(<GuidePicker options={options} value="clownfish" onChange={() => undefined} />);
    const group = screen.getByRole('radiogroup', { name: '밑그림 선택' });
    scrollable(group);
    fireEvent.scroll(group);

    expect((screen.getByRole('button', { name: '다음 밑그림 보기' }) as HTMLButtonElement).disabled).toBe(false);
    group.scrollLeft = 220;
    fireEvent.scroll(group);
    const previous = screen.getByRole('button', { name: '이전 밑그림 보기' });
    expect((previous as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(previous);
    expect(group.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    expect((group.scrollBy as ReturnType<typeof vi.fn>).mock.calls[0][0].left).toBeLessThan(0);
  });

  it('마우스 드래그로 가로 스크롤하고 선택 클릭을 오작동시키지 않는다', () => {
    const onChange = vi.fn();
    render(<GuidePicker options={options} value="clownfish" onChange={onChange} />);
    const group = screen.getByRole('radiogroup', { name: '밑그림 선택' });
    scrollable(group);

    fireEvent(group, pointer('pointerdown', { button: 0, pointerId: 1, clientX: 200 }));
    fireEvent(group, pointer('pointermove', { pointerId: 1, clientX: 100 }));
    fireEvent(group, pointer('pointerup', { pointerId: 1, clientX: 100 }));
    fireEvent.click(screen.getByRole('radio', { name: '블루탱' }));

    expect(group.scrollLeft).toBe(100);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('터치는 커스텀 좌표 계산 대신 네이티브 가로 스와이프와 카드 스냅을 사용한다', () => {
    render(<GuidePicker options={options} value="clownfish" onChange={() => undefined} />);
    const group = screen.getByRole('radiogroup', { name: '밑그림 선택' });
    scrollable(group);

    fireEvent(group, pointer('pointerdown', { pointerId: 3, clientX: 200, pointerType: 'touch' }));
    fireEvent(group, pointer('pointermove', { pointerId: 3, clientX: 80, pointerType: 'touch' }));

    expect(group.scrollLeft).toBe(0);
    expect(group.className).toContain('touch-pan-x');
    expect(group.className).toContain('snap-x');
  });
});
