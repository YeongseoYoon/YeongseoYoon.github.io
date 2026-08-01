/** 충돌 가능성이 낮은 짧은 id 생성. (mock 환경 전용) */
export function createId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}${time}${rand}`;
}
