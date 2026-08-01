import { SEED_USER_ID } from '@/entities/user';
import type { Report } from '../model/types';

const HOUR = 3_600_000;
const ago = (h: number) => Date.now() - h * HOUR;

/**
 * 신고 큐 시드. 'c-tangtang'에 3건 누적 → 임시 숨김 임계(PRD 7.4) 시연.
 */
export const seedReports = (): Report[] => [
  { id: 'r-1', creatureId: 'c-tangtang', reporterId: SEED_USER_ID.jipge, reason: 'spam', detail: '', createdAt: ago(2), resolved: false },
  { id: 'r-2', creatureId: 'c-tangtang', reporterId: SEED_USER_ID.night, reason: 'spam', detail: '', createdAt: ago(1.5), resolved: false },
  { id: 'r-3', creatureId: 'c-tangtang', reporterId: SEED_USER_ID.shell, reason: 'etc', detail: '같은 그림을 계속 올려요', createdAt: ago(1), resolved: false },
  { id: 'r-4', creatureId: 'c-haemi', reporterId: SEED_USER_ID.bbogle, reason: 'privacy', detail: '', createdAt: ago(3), resolved: false },
];
