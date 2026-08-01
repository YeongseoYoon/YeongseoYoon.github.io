import { db } from '@/shared/api';

/**
 * 각 테스트 전에 저장소를 비운다.
 * 다음 접근 때 각 엔티티가 시드를 다시 심으므로 테스트끼리 상태가 새지 않는다.
 */
export async function resetDb(): Promise<void> {
  await db.clear();
  localStorage.clear();
}
