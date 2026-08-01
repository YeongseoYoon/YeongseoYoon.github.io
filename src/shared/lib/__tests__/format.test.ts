import { describe, expect, it } from 'vitest';
import { formatRelativeTime, formatSubmittedAt } from '../format';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('시간 표기', () => {
  const now = new Date('2026-08-01T13:52:00').getTime();

  it('TC-9-1 상대 시간을 한국어로 표기한다', () => {
    expect(formatRelativeTime(now - 10_000, now)).toBe('방금 전');
    expect(formatRelativeTime(now - 5 * MIN, now)).toBe('5분 전');
    expect(formatRelativeTime(now - 3 * HOUR, now)).toBe('3시간 전');
    expect(formatRelativeTime(now - 2 * DAY, now)).toBe('2일 전');
  });

  it('TC-9-2 오늘 제출은 "오늘 HH:MM"으로 표기한다', () => {
    expect(formatSubmittedAt(now, now)).toBe('오늘 13:52');
  });
});
