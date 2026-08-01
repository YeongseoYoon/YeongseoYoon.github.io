import { describe, expect, it } from 'vitest';
import { decodeSprite, encodeSprite, isSpriteEmpty } from '../spriteCodec';

/** 36×32 캔버스에 몇 칸만 칠한 샘플 */
function sample(w = 36, h = 32) {
  const pixels: (string | null)[] = Array(w * h).fill(null);
  pixels[0] = '#f8820d';
  pixels[1] = '#f8820d';
  pixels[40] = '#21afbf';
  pixels[w * h - 1] = '#23242a';
  return { w, h, pixels };
}

describe('spriteCodec', () => {
  it('TC-1-1 인코딩 → 디코딩 왕복이 원본과 같다', () => {
    const { w, h, pixels } = sample();
    const decoded = decodeSprite(encodeSprite(pixels, w, h));
    expect(decoded).not.toBeNull();
    expect(decoded!.width).toBe(w);
    expect(decoded!.height).toBe(h);
    expect(decoded!.pixels).toEqual(pixels);
  });

  it('TC-1-2 빈 캔버스는 모두 투명으로 복원되고 empty로 판정된다', () => {
    const empty = Array(36 * 32).fill(null);
    const code = encodeSprite(empty, 36, 32);
    expect(decodeSprite(code)!.pixels.every((p) => p === null)).toBe(true);
    expect(isSpriteEmpty(code)).toBe(true);
  });

  it('TC-1-3 색이 하나라도 있으면 empty가 아니다', () => {
    const { w, h, pixels } = sample();
    expect(isSpriteEmpty(encodeSprite(pixels, w, h))).toBe(false);
  });

  it('TC-1-4 JSON 배열보다 훨씬 짧다', () => {
    const { w, h, pixels } = sample();
    const code = encodeSprite(pixels, w, h);
    expect(code.length).toBeLessThan(JSON.stringify(pixels).length / 10);
  });

  it('TC-1-5 색상 대소문자가 달라도 왕복이 일치한다', () => {
    const pixels: (string | null)[] = Array(4).fill(null);
    pixels[0] = '#AABBCC';
    pixels[1] = '#aabbcc';
    const decoded = decodeSprite(encodeSprite(pixels, 2, 2))!;
    expect(decoded.pixels[0]).toBe('#aabbcc');
    expect(decoded.pixels[1]).toBe('#aabbcc');
  });

  it('TC-1-6/7/8 깨진 입력은 예외 대신 null을 반환한다', () => {
    expect(decodeSprite('쓰레기')).toBeNull();
    expect(decodeSprite('9|36|32|#fff|0.1152')).toBeNull(); // 버전 불일치
    expect(decodeSprite('1|36|32|#fff|0.5')).toBeNull(); // 길이 불일치
  });
});
