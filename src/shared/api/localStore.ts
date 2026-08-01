/**
 * 로컬 영속 저장소 (모바일/WebView 대응).
 *
 * 왜 IndexedDB인가:
 * - localStorage는 대부분 브라우저/WebView에서 **5MB 내외**, 동기 API라 메인 스레드를 막는다.
 *   픽셀 스프라이트가 쌓이면 금방 한도에 닿고, 초과 시 조용히 실패한다.
 * - IndexedDB는 iOS/Android WebView(앱인토스 포함)에서 모두 지원되고 용량이 훨씬 크며 비동기다.
 * - 실패(사파리 프라이빗 모드 등) 시 localStorage로 자동 폴백한다.
 *
 * 키-값 하나(스냅샷)만 다루므로 스토어는 단순하게 유지한다.
 */

const DB_NAME = 'endless-aquarium';
const STORE = 'kv';
const FALLBACK_PREFIX = 'endless-aquarium/kv/';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  dbPromise ??= openDb();
  return dbPromise;
}

export async function loadValue<T>(key: string): Promise<T | null> {
  const conn = await db();
  if (conn) {
    const value = await new Promise<T | null>((resolve) => {
      try {
        const req = conn.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    if (value !== null) return value;
  }
  // 폴백
  try {
    const raw = localStorage.getItem(FALLBACK_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveValue(key: string, value: unknown): Promise<void> {
  const conn = await db();
  if (conn) {
    const ok = await new Promise<boolean>((resolve) => {
      try {
        const tx = conn.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
    if (ok) return;
  }
  try {
    localStorage.setItem(FALLBACK_PREFIX + key, JSON.stringify(value));
  } catch {
    /* 용량 초과 — mock 환경에서는 무시 */
  }
}

export async function clearValue(key: string): Promise<void> {
  const conn = await db();
  if (conn) {
    try {
      conn.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
    } catch {
      /* noop */
    }
  }
  try {
    localStorage.removeItem(FALLBACK_PREFIX + key);
  } catch {
    /* noop */
  }
}
