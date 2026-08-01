import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator);
        const value = line.slice(separator + 1).replace(/^['"]|['"]$/g, '');
        return [key, value];
      }),
  );
}

const env = parseEnv(await readFile(new URL('../.env.local', import.meta.url), 'utf8'));
const makeClient = () =>
  createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: WebSocket },
  });

const supabase = makeClient();
let reporter = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function rpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

const runId = crypto.randomUUID();
const checks = [];

try {
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw authError;
  assert(authData.user, 'anonymous auth did not return a user');
  checks.push('anonymous-auth');

  const profile = await rpc('claim_identity', {
    p_source: 'device',
    p_raw_key: `integration-${runId}`,
    p_nickname: '통합테스트',
  });
  assert(profile?.id === authData.user.id, 'profile id does not match auth uid');
  assert(profile?.role === 'creator', 'new profile must be a creator');
  checks.push('identity-claim');

  const { data: zones, error: zonesError } = await supabase.from('zones').select('*');
  if (zonesError) throw zonesError;
  assert(zones?.length === 4, 'expected four seeded zones');
  checks.push('public-zone-read');

  const draft = await rpc('save_draft', {
    p_kind: 'fish',
    p_name: '서버초안',
    p_message: '초안',
    p_sprite: `integration-sprite-${runId}`,
    p_draft_id: null,
  });
  assert(draft?.status === 'draft', 'save_draft did not create a draft');
  checks.push('save-draft');

  const released = await rpc('release_creature', {
    p_kind: 'fish',
    p_name: '서버물고기',
    p_message: '공유 바다 연결 완료',
    p_sprite: `integration-sprite-${runId}`,
    p_draft_id: draft.id,
  });
  assert(released?.status === 'published', 'release_creature did not publish');
  assert(released?.zone_id, 'released creature has no zone');
  assert(Number.isInteger(Number(released?.slot)), 'released creature has no slot');
  checks.push('transactional-release');

  const updated = await rpc('update_creature_message', {
    p_creature_id: released.id,
    p_message: '서버 수정 완료',
  });
  assert(updated?.message === '서버 수정 완료', 'message update failed');
  checks.push('owner-update');

  reporter = makeClient();
  const { data: reporterAuth, error: reporterAuthError } = await reporter.auth.signInAnonymously();
  if (reporterAuthError) throw reporterAuthError;
  const { error: reporterIdentityError } = await reporter.rpc('claim_identity', {
    p_source: 'device',
    p_raw_key: `reporter-${runId}`,
    p_nickname: '신고테스트',
  });
  if (reporterIdentityError) throw reporterIdentityError;
  const { data: reportResult, error: reportError } = await reporter.rpc('submit_report', {
    p_creature_id: released.id,
    p_reason: 'spam',
    p_detail: '',
  });
  if (reportError) throw reportError;
  assert(reportResult?.auto_hidden === false, 'one report unexpectedly hid the creature');
  const { error: duplicateReportError } = await reporter.rpc('submit_report', {
    p_creature_id: released.id,
    p_reason: 'spam',
    p_detail: '',
  });
  assert(duplicateReportError, 'duplicate report was unexpectedly accepted');
  assert(reporterAuth.user, 'reporter auth did not return a user');
  checks.push('report-and-deduplicate');

  const { error: adminError } = await supabase.rpc('moderate_creature', {
    p_creature_id: released.id,
    p_action: 'hide',
    p_reason: '권한 테스트',
    p_zone_id: null,
  });
  assert(adminError, 'creator unexpectedly executed an admin operation');
  checks.push('admin-denied');

  await rpc('delete_creature', { p_creature_id: released.id });
  const { data: deleted, error: deletedError } = await supabase
    .from('creatures')
    .select('status, slot')
    .eq('id', released.id)
    .single();
  if (deletedError) throw deletedError;
  assert(deleted.status === 'deleted', 'delete_creature did not soft-delete');
  assert(Number(deleted.slot) === Number(released.slot), 'soft-delete changed the slot');
  checks.push('soft-delete');

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: releaseCount, error: quotaError } = await supabase
    .from('creatures')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authData.user.id)
    .gte('submitted_at', dayStart.toISOString());
  if (quotaError) throw quotaError;
  assert(releaseCount === 1, 'deleting a creature incorrectly reset the daily quota');
  checks.push('quota-survives-delete');

  console.log(`Supabase integration OK: ${checks.join(', ')}`);
} finally {
  if (reporter) await reporter.auth.signOut();
  await supabase.auth.signOut();
}
