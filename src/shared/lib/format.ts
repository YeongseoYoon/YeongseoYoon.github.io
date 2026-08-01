/** 상대 시간 표기 (한국어). "방금 전 · N분 전 · N시간 전 · N일 전". */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  const MIN = 60;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  if (diffSec < MIN) return '방금 전';
  if (diffSec < HOUR) return `${Math.floor(diffSec / MIN)}분 전`;
  if (diffSec < DAY) return `${Math.floor(diffSec / HOUR)}시간 전`;
  return `${Math.floor(diffSec / DAY)}일 전`;
}

/** "오늘 13:52" 형태의 제출 시각 표기. */
export function formatSubmittedAt(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const isToday = new Date(now).toDateString() === date.toDateString();
  const dayLabel = isToday ? '오늘' : `${date.getMonth() + 1}/${date.getDate()}`;
  return `${dayLabel} ${hh}:${mm}`;
}
