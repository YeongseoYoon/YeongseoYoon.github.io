/**
 * 브라우저 프로필 식별 (PRD 10: 최소 식별).
 * 웹에서는 물리 기기를 안전하게 식별할 수 없으므로, 같은 브라우저 프로필에 발급한
 * 충분히 긴 익명 키를 사용한다. localStorage와 쿠키 중 하나가 지워져도 다른 쪽에서
 * 복구할 수 있게 이중 저장한다. 서버에는 이 원문이 아니라 해시만 저장된다.
 */
const DEVICE_KEY = 'endless-aquarium/device-id';
const DEVICE_COOKIE = 'endless_aquarium_device_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${DEVICE_COOKIE}=`;
  const entry = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function writeCookie(id: string): void {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${DEVICE_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

function createDeviceId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `device-v2-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'device-anon';
  let id = localStorage.getItem(DEVICE_KEY) ?? readCookie();
  if (!id) {
    id = createDeviceId();
  }
  localStorage.setItem(DEVICE_KEY, id);
  writeCookie(id);
  return id;
}
