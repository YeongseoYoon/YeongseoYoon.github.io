import { getSupabaseClient, isSupabaseMode, rpcVoid } from '@/shared/api';

export type AccountAccessMode = 'preserve' | 'restore';

const AUTH_INTENT_KEY = 'endless-aquarium/auth-intent';

export function isMissingAccountError(reason: unknown): boolean {
  return reason instanceof Error && /signups? not allowed for otp/i.test(reason.message);
}

export function accountAccessErrorMessage(reason: unknown): string {
  if (isMissingAccountError(reason)) {
    return '아직 보관된 수조가 없는 이메일이에요. 현재 수조를 먼저 보관해 주세요.';
  }
  return reason instanceof Error ? reason.message : '로그인을 시작하지 못했어요.';
}

export function authCallbackUrl(next = '/my-tank'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const url = new URL(`${base}/auth/callback`, window.location.origin);
  url.searchParams.set('next', safeNextPath(next));
  return url.toString();
}

export function safeNextPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/my-tank';
}

function rememberIntent(mode: AccountAccessMode) {
  sessionStorage.setItem(AUTH_INTENT_KEY, mode);
}

async function updateNickname(nickname: string): Promise<void> {
  const value = nickname.trim();
  if (!value) return;
  await rpcVoid('update_my_profile', { p_nickname: value });
}

export async function startKakaoAccess(mode: AccountAccessMode, nickname = ''): Promise<void> {
  if (!isSupabaseMode) throw new Error('공유 서버에서만 계정을 연결할 수 있어요.');
  if (mode === 'preserve') await updateNickname(nickname);
  rememberIntent(mode);

  const supabase = getSupabaseClient();
  const redirectTo = authCallbackUrl();
  const result = mode === 'preserve'
    ? await supabase.auth.linkIdentity({ provider: 'kakao', options: { redirectTo } })
    : await supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo } });
  if (result.error) throw result.error;
  if (result.data.url) window.location.assign(result.data.url);
}

export async function startEmailAccess(
  mode: AccountAccessMode,
  email: string,
  nickname = '',
): Promise<void> {
  if (!isSupabaseMode) throw new Error('공유 서버에서만 계정을 연결할 수 있어요.');
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('이메일 주소를 확인해 주세요.');
  if (mode === 'preserve') await updateNickname(nickname);
  rememberIntent(mode);

  const supabase = getSupabaseClient();
  if (mode === 'preserve') {
    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: authCallbackUrl() },
    );
    if (error) throw error;
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: authCallbackUrl(),
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function completeAuthCallback(currentUrl = window.location.href): Promise<string> {
  if (!isSupabaseMode) return '/my-tank';
  const url = new URL(currentUrl);
  const code = url.searchParams.get('code');
  const supabase = getSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session || data.session.user.is_anonymous) {
    throw new Error('로그인을 완료하지 못했어요. 다시 시도해 주세요.');
  }
  sessionStorage.removeItem(AUTH_INTENT_KEY);
  return safeNextPath(url.searchParams.get('next'));
}

export async function signOutAccount(): Promise<void> {
  if (!isSupabaseMode) return;
  const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
  if (error) throw error;
}
