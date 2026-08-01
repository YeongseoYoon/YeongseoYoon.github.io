import type { Creature } from '@/entities/creature';
import { assetUrl, spriteToDataUrl } from '@/shared/lib';

const PUBLIC_APP_URL = 'https://yeongseoyoon.github.io/';

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('공유 이미지에 생물을 불러오지 못했습니다.'));
    image.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const next = line + char;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/** 인스타그램 스토리 등에 바로 올릴 수 있는 9:16 PNG 카드. */
export async function createCreatureStoryCard(creature: Creature): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서는 공유 카드를 만들 수 없습니다.');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#72e5ed');
  gradient.addColorStop(0.48, '#27a7bb');
  gradient.addColorStop(1, '#07566a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(227, 255, 255, .58)';
  ctx.lineWidth = 7;
  for (const [x, y, r] of [[126, 220, 25], [188, 145, 12], [920, 305, 34], [850, 220, 15], [170, 1080, 18]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, .17)';
  ctx.beginPath();
  ctx.roundRect(90, 370, 900, 1120, 56);
  ctx.fill();

  const spriteSource = creature.sprite
    ? spriteToDataUrl(creature.sprite)
    : assetUrl(`${creature.spriteKey ?? 'clownfish'}.png`);
  if (!spriteSource) throw new Error('공유할 생물 그림이 비어 있습니다.');
  const sprite = await loadImage(spriteSource);
  const maxSide = 570;
  const scale = Math.min(maxSide / sprite.width, maxSide / sprite.height);
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, (canvas.width - width) / 2, 540 + (540 - height) / 2, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#074255';
  ctx.font = '800 42px Pretendard, sans-serif';
  ctx.fillText('끝없는 수족관에서 만난', 540, 260);
  ctx.font = '900 82px Pretendard, sans-serif';
  ctx.fillText(creature.name, 540, 1325);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 44px Pretendard, sans-serif';
  const message = creature.message || '바다에서 함께 헤엄쳐요';
  wrapText(ctx, `“${message}”`, 760).forEach((line, index) => {
    ctx.fillText(line, 540, 1420 + index * 58);
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px Pretendard, sans-serif';
  ctx.fillText('끝없는 수족관', 540, 1695);
  ctx.font = '600 30px Pretendard, sans-serif';
  ctx.fillText('나만의 생물을 그리고 바다에 방류해 보세요', 540, 1755);
  ctx.font = '500 26px Pretendard, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, .8)';
  ctx.fillText('yeongseoyoon.github.io', 540, 1815);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('공유 카드 저장에 실패했습니다.')),
      'image/png',
    );
  });
}
