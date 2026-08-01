import type { User } from '../model/types';

/** 안정적인 시드 id — 다른 엔티티(작품/신고)가 참조한다. */
export const SEED_USER_ID = {
  me: 'user-me',
  admin: 'user-admin',
  bbogle: 'user-bbogle',
  jipge: 'user-jipge',
  haema: 'user-haema',
  night: 'user-night',
  shell: 'user-shell',
} as const;

const now = Date.now();

export const seedUsers = (): User[] => [
  { id: SEED_USER_ID.me, nickname: '말미잘', role: 'creator', strikes: 0, createdAt: now },
  { id: SEED_USER_ID.admin, nickname: '김바다', role: 'admin', strikes: 0, createdAt: now },
  { id: SEED_USER_ID.bbogle, nickname: '뽀글뽀글', role: 'creator', strikes: 0, createdAt: now },
  { id: SEED_USER_ID.jipge, nickname: '집게손', role: 'creator', strikes: 0, createdAt: now },
  { id: SEED_USER_ID.haema, nickname: '해마지기', role: 'creator', strikes: 1, createdAt: now },
  { id: SEED_USER_ID.night, nickname: '밤하늘', role: 'creator', strikes: 0, createdAt: now },
  { id: SEED_USER_ID.shell, nickname: '등껍질', role: 'creator', strikes: 0, createdAt: now },
];
