/**
 * 픽셀 스프라이트 직렬화 (팔레트 + RLE).
 *
 * 왜: 36×32 = 1,152칸을 hex 문자열 배열(JSON)로 저장하면 마리당 ~15KB.
 * 팔레트 인덱스 + 런렝스로 바꾸면 보통 0.3~1.5KB로 줄어든다.
 * 서버 전송/저장도 이 문자열 하나만 주고받으면 된다(컬럼 1개, 인덱싱 불필요).
 *
 * 형식: `1|W|H|#hex,#hex,...|runs`
 *   - 팔레트: 실제 사용된 색만. 인덱스 0은 항상 투명(팔레트에 없음).
 *   - runs: `idx.count` 를 `-`로 이어붙임. idx 0 = 투명.
 *   예) `1|36|32|#21afbf,#23242a|0.40-1.6-2.3-0.1103`
 */

export interface DecodedSprite {
  width: number;
  height: number;
  /** 길이 = width*height. null이면 투명. */
  pixels: (string | null)[];
}

const VERSION = '1';

/** 픽셀 배열 → 저장/전송용 문자열. */
export function encodeSprite(pixels: (string | null)[], width: number, height: number): string {
  const palette: string[] = [];
  const indexOf = new Map<string, number>();

  const codes = pixels.map((p) => {
    if (!p) return 0;
    const key = p.toLowerCase();
    let idx = indexOf.get(key);
    if (idx === undefined) {
      palette.push(key);
      idx = palette.length; // 0은 투명이므로 1부터
      indexOf.set(key, idx);
    }
    return idx;
  });

  const runs: string[] = [];
  let current = codes[0] ?? 0;
  let count = 0;
  for (const c of codes) {
    if (c === current) {
      count += 1;
    } else {
      runs.push(`${current}.${count}`);
      current = c;
      count = 1;
    }
  }
  if (count > 0) runs.push(`${current}.${count}`);

  return [VERSION, width, height, palette.join(','), runs.join('-')].join('|');
}

/** 저장 문자열 → 픽셀 배열. 형식이 깨졌으면 null. */
export function decodeSprite(code: string): DecodedSprite | null {
  const parts = code.split('|');
  if (parts.length !== 5 || parts[0] !== VERSION) return null;

  const width = Number(parts[1]);
  const height = Number(parts[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;

  const palette = parts[3] ? parts[3].split(',') : [];
  const pixels: (string | null)[] = [];

  for (const run of parts[4].split('-')) {
    if (!run) continue;
    const dot = run.indexOf('.');
    const idx = Number(run.slice(0, dot));
    const count = Number(run.slice(dot + 1));
    if (!Number.isFinite(idx) || !Number.isFinite(count)) return null;
    const color = idx === 0 ? null : (palette[idx - 1] ?? null);
    for (let i = 0; i < count; i += 1) pixels.push(color);
  }

  if (pixels.length !== width * height) return null;
  return { width, height, pixels };
}

/** 빈 캔버스인지 (모두 투명) — 방류 검증용. */
export function isSpriteEmpty(code: string): boolean {
  const decoded = decodeSprite(code);
  return !decoded || decoded.pixels.every((p) => p === null);
}
