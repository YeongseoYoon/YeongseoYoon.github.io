/** Vite의 배포 base 경로를 반영한 public/assets URL을 만든다. */
export function assetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/${fileName.replace(/^\/+/, '')}`;
}
