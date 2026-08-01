import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Creature } from '@/entities/creature';
import { MyTankPreview } from '../ui/MyTankPreview';

function creature(patch: Partial<Creature>): Creature {
  return {
    id: 'c1',
    kind: 'fish',
    motion: 'swim',
    name: '물고기',
    message: '',
    status: 'published',
    authorId: 'owner',
    authorNickname: '주인',
    zoneId: 'z1',
    sprite: null,
    spriteKey: 'clownfish',
    worldX: 0,
    worldY: 0,
    slot: 1,
    rejectionReason: null,
    createdAt: 1,
    submittedAt: 1,
    publishedAt: 1,
    ...patch,
  };
}

describe('MyTankPreview', () => {
  it('삭제된 생물은 수조에 렌더하지 않는다', () => {
    render(<MyTankPreview creatures={[creature({ status: 'deleted' })]} />);
    expect(screen.queryByAltText('물고기')).toBeNull();
    expect(screen.getByText('내 생물 0')).toBeTruthy();
  });

  it('해초와 장식물은 모래 바닥 기준으로 배치한다', () => {
    render(
      <MyTankPreview
        creatures={[
          creature({ id: 'weed', kind: 'seaweed', motion: 'sway', name: '해초', spriteKey: 'weed' }),
          creature({ id: 'star', kind: 'decoration', motion: 'still', name: '불가사리', spriteKey: 'star' }),
        ]}
      />,
    );

    expect(screen.getByAltText('해초').parentElement?.parentElement?.style.bottom).toBe('31px');
    expect(screen.getByAltText('불가사리').parentElement?.parentElement?.style.bottom).toBe('29px');
  });
});
