const PUBLIC_APP_URL = 'https://endless-aquarium.vercel.app/';

export function buildCreatureShareUrl(
  creatureId: string,
  appUrl = typeof window === 'undefined'
    ? PUBLIC_APP_URL
    : new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
): string {
  const url = new URL(appUrl);
  url.searchParams.set('focus', creatureId);
  return url.toString();
}

export function buildTankShareUrl(
  authorId: string,
  appUrl = typeof window === 'undefined'
    ? PUBLIC_APP_URL
    : new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
): string {
  const base = new URL(appUrl);
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  return new URL(`tank/${encodeURIComponent(authorId)}`, base).toString();
}
