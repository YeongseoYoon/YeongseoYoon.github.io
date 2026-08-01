import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinkShareActions } from '../ui/LinkShareActions';

describe('LinkShareActions', () => {
  it('파일 다운로드 없이 링크 공유 선택지만 보여준다', () => {
    render(
      <LinkShareActions
        data={{
          title: '끝없는 수족관',
          text: '수족관을 구경해요',
          url: 'https://example.com/tank/owner',
          buttonTitle: '수족관 구경하기',
        }}
        linkLabel="수족관"
      />,
    );

    expect(screen.getByRole('button', { name: 'K 카카오톡' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Instagram' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '다른 앱' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /이미지|다운로드/ })).toBeNull();
  });
});
