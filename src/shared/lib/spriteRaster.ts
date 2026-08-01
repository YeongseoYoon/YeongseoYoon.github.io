import { decodeSprite } from './spriteCodec';

/**
 * 스프라이트 코드 → 캔버스로 래스터화한 data URL.
 *
 * 왜: SVG <rect>를 픽셀마다 그리면 마리당 최대 1,152 노드 → 100마리면 10만 노드.
 * 캔버스로 한 번 구워서 <img> 하나로 렌더하면 노드 수가 마리당 1개가 된다.
 * 확대는 CSS `image-rendering: pixelated`가 처리하므로 원본 해상도로만 굽는다.
 *
 * 같은 코드는 캐시해서 재사용한다(대부분의 생물은 리렌더돼도 다시 굽지 않음).
 */

const cache = new Map<string, string>();
/** 그리기 중 미리보기처럼 매 획마다 코드가 바뀌는 경우를 대비한 상한. */
const MAX_CACHE = 300;

export function spriteToDataUrl(code: string): string | null {
  const hit = cache.get(code);
  if (hit) return hit;

  const decoded = decodeSprite(code);
  if (!decoded || typeof document === 'undefined') return null;

  const { width, height, pixels } = decoded;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const image = ctx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i += 1) {
    const color = pixels[i];
    if (!color) continue; // 투명은 그대로 둔다
    const [r, g, b] = hexToRgb(color);
    const o = i * 4;
    image.data[o] = r;
    image.data[o + 1] = g;
    image.data[o + 2] = b;
    image.data[o + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const url = canvas.toDataURL('image/png');
  if (cache.size >= MAX_CACHE) {
    // 가장 오래된 항목부터 비운다(삽입 순서 보장).
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(code, url);
  return url;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
