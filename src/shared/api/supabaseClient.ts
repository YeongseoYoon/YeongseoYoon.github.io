import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env?.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error('Supabase 모드에는 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY가 필요합니다.');
  }
  client = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export async function rpcOne<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().rpc(name, params);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error(`${name} 결과가 비어 있습니다.`);
  return row as T;
}

export async function rpcVoid(name: string, params: Record<string, unknown>): Promise<void> {
  const { error } = await getSupabaseClient().rpc(name, params);
  if (error) throw error;
}

export function subscribeToServerChanges(tables: string[], onChange: () => void): () => void {
  const supabase = getSupabaseClient();
  let channel: RealtimeChannel = supabase.channel(
    `aquarium-${tables.join('-')}-${crypto.randomUUID()}`,
  );
  for (const table of tables) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      onChange,
    );
  }
  void channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

