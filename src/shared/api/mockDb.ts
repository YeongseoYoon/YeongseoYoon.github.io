import { MOCK_LATENCY_MS } from '../config';
import { clearValue, loadValue, saveValue } from './localStore';

/**
 * 도메인 비의존 mock 백엔드.
 *
 * 설계 의도: 실제 서버로 교체할 때 이 파일과 각 엔티티의 api 구현만 바꾸면 되도록,
 * UI/피처는 각 엔티티가 노출하는 api(추상)에만 의존한다(DIP).
 *
 * - 메모리를 소스로 두고 IndexedDB에 스냅샷을 비동기 저장(디바운스)한다.
 * - 모든 읽기/쓰기는 hydrate 완료를 기다린다 → 첫 조회가 빈 배열로 보이지 않는다.
 */

export interface Identifiable {
  id: string;
}

const SNAPSHOT_KEY = 'db/v6';
const PERSIST_DEBOUNCE_MS = 120;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

type Tables = Record<string, Identifiable[]>;

export interface Collection<T extends Identifiable> {
  list(predicate?: (row: T) => boolean): Promise<T[]>;
  find(id: string): Promise<T | null>;
  insert(row: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

class MockDb {
  private tables: Tables = {};
  private seeds = new Map<string, () => Identifiable[]>();
  private ready: Promise<void>;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.ready = this.hydrate();
  }

  private async hydrate(): Promise<void> {
    const snapshot = await loadValue<Tables>(SNAPSHOT_KEY);
    if (snapshot) this.tables = snapshot;
  }

  /** 아직 없는 컬렉션은 시드로 채운다 (hydrate 이후에 판단). */
  private ensure(name: string): void {
    const seed = this.seeds.get(name);
    if (seed && !(name in this.tables)) {
      this.tables[name] = seed();
      this.persist();
    }
  }

  collection<T extends Identifiable>(name: string, seed?: () => T[]): Collection<T> {
    if (seed) this.seeds.set(name, seed as () => Identifiable[]);

    const rows = async (): Promise<T[]> => {
      await this.ready;
      this.ensure(name);
      return (this.tables[name] ?? []) as T[];
    };

    return {
      list: async (predicate) => {
        const all = await rows();
        return delay(predicate ? all.filter(predicate) : [...all]);
      },
      find: async (id) => {
        const all = await rows();
        return delay(all.find((r) => r.id === id) ?? null);
      },
      insert: async (row) => {
        const all = await rows();
        this.tables[name] = [...all, row];
        this.persist();
        return delay(row);
      },
      update: async (id, patch) => {
        await rows();
        // await 이후에 **최신** 테이블을 읽는다.
        // 앞서 읽어둔 스냅샷을 덮어쓰면 동시 업데이트가 유실된다(lost update).
        const all = [...((this.tables[name] ?? []) as T[])];
        const index = all.findIndex((r) => r.id === id);
        if (index === -1) throw new Error(`${name} #${id} not found`);
        const next = { ...all[index], ...patch } as T;
        all[index] = next;
        this.tables[name] = all;
        this.persist();
        return delay(next);
      },
      remove: async (id) => {
        const all = await rows();
        this.tables[name] = all.filter((r) => r.id !== id);
        this.persist();
        return delay(undefined);
      },
    };
  }

  /** 개발용: 저장소를 비운다(다음 접근 시 재시드). */
  async clear(): Promise<void> {
    this.tables = {};
    await clearValue(SNAPSHOT_KEY);
  }

  /** 연속 쓰기를 한 번으로 묶어 저장한다. */
  private persist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void saveValue(SNAPSHOT_KEY, this.tables);
    }, PERSIST_DEBOUNCE_MS);
  }
}

/** 앱 전역 단일 mock 백엔드. 실제 서버 도입 시 이 지점을 교체한다. */
export const db = new MockDb();

export type { Tables };
export { MockDb };
