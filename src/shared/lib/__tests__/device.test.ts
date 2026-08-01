import { beforeEach, describe, expect, it } from 'vitest';
import { getDeviceId } from '../device';

const STORAGE_KEY = 'endless-aquarium/device-id';
const COOKIE_KEY = 'endless_aquarium_device_id';

function clearDeviceCookie() {
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0`;
}

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorage.clear();
    clearDeviceCookie();
  });

  it('creates and reuses a cryptographically strong browser profile id', () => {
    const first = getDeviceId();
    const second = getDeviceId();

    expect(first).toMatch(/^device-v2-[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });

  it('recovers the same id from the cookie when local storage is missing', () => {
    const first = getDeviceId();
    localStorage.removeItem(STORAGE_KEY);

    expect(getDeviceId()).toBe(first);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(first);
  });

  it('restores the cookie from local storage', () => {
    const first = getDeviceId();
    clearDeviceCookie();

    expect(getDeviceId()).toBe(first);
    expect(document.cookie).toContain(`${COOKIE_KEY}=`);
  });
});
