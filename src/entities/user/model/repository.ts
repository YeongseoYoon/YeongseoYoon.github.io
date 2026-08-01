import type { User } from './types';

/**
 * 사용자 저장소 추상 (DIP). 소비자는 이 인터페이스에만 의존하고,
 * mock/실서버 구현은 교체 가능하다.
 */
export interface UserRepository {
  get(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  update(id: string, patch: Partial<User>): Promise<User>;
}
