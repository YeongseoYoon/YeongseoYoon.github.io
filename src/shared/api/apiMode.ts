export type ApiMode = 'mock' | 'supabase';

export const API_MODE: ApiMode =
  import.meta.env?.MODE !== 'test' && import.meta.env?.VITE_API_MODE === 'supabase'
    ? 'supabase'
    : 'mock';

export const isSupabaseMode = API_MODE === 'supabase';
