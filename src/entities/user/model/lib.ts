import type { User } from './types';

/** 무명 사용자는 "이름 없는 탐험가"로 표기(PRD 14.1: 무명 허용). */
export function displayName(user: Pick<User, 'nickname'>): string {
  return user.nickname?.trim() || '이름 없는 탐험가';
}
