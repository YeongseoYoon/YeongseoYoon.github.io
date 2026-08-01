import { db, isSupabaseMode } from '@/shared/api';
import type { User } from '../model/types';
import type { UserRepository } from '../model/repository';
import { seedUsers } from './seed';
import { supabaseUserApi } from './supabaseUserApi';

const users = db.collection<User>('users', seedUsers);

/** UserRepository의 mock 구현. 실서버 도입 시 이 객체만 교체한다. */
const mockUserApi: UserRepository = {
  get: (id) => users.find(id),
  list: () => users.list(),
  update: (id, patch) => users.update(id, patch),
};

export const userApi: UserRepository = isSupabaseMode ? supabaseUserApi : mockUserApi;
