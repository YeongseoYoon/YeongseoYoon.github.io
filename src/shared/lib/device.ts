/**
 * 기기 식별 (PRD 10: 최소 식별). 가입 없이도 창작물 소유·방류 한도를 기기 단위로 묶는다.
 * localStorage에 1회 생성해 보관한다. (mock 환경 — 실제로는 서버 세션/디바이스 토큰으로 대체)
 */
const DEVICE_KEY = 'endless-aquarium/device-id';

export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'device-anon';
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `device-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
