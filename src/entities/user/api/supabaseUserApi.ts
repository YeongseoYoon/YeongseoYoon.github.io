import { getSupabaseClient } from '@/shared/api';
import type { User } from '../model/types';
import type { UserRepository } from '../model/repository';

export interface UserRow {
  id: string;
  nickname: string | null;
  role: 'creator' | 'admin';
  strikes: number;
  created_at: string;
}

export const userFromRow = (row: UserRow): User => ({
  id: row.id,
  nickname: row.nickname,
  role: row.role,
  strikes: row.strikes,
  createdAt: new Date(row.created_at).getTime(),
});

export const supabaseUserApi: UserRepository = {
  get: async (id) => {
    const { data, error } = await getSupabaseClient().from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? userFromRow(data as UserRow) : null;
  },
  list: async () => {
    const { data, error } = await getSupabaseClient().from('users').select('*').order('created_at');
    if (error) throw error;
    return (data as UserRow[]).map(userFromRow);
  },
  update: async () => {
    throw new Error('Supabase 모드의 사용자 변경은 서버 운영 함수에서만 가능합니다.');
  },
};

