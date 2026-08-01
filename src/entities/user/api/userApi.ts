import { db } from '@/shared/api';
import type { User } from '../model/types';
import type { UserRepository } from '../model/repository';
import { seedUsers } from './seed';

const users = db.collection<User>('users', seedUsers);

/** UserRepository의 mock 구현. 실서버 도입 시 이 객체만 교체한다. */
export const userApi: UserRepository = {
  get: (id) => users.find(id),
  list: () => users.list(),
  update: (id, patch) => users.update(id, patch),
};
