import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import WebSocket from 'ws';

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [
          line.slice(0, separator),
          line.slice(separator + 1).replace(/^['"]|['"]$/g, ''),
        ];
      }),
  );
}

function encodeSprite(pixels, width = 36, height = 32) {
  const palette = [];
  const paletteIndex = new Map();
  const codes = pixels.map((color) => {
    if (!color) return 0;
    const normalized = color.toLowerCase();
    if (!paletteIndex.has(normalized)) {
      palette.push(normalized);
      paletteIndex.set(normalized, palette.length);
    }
    return paletteIndex.get(normalized);
  });
  const runs = [];
  let current = codes[0];
  let count = 0;
  for (const code of codes) {
    if (code === current) count += 1;
    else {
      runs.push(`${current}.${count}`);
      current = code;
      count = 1;
    }
  }
  runs.push(`${current}.${count}`);
  return `1|${width}|${height}|${palette.join(',')}|${runs.join('-')}`;
}

/** 기존 픽셀 에셋을 사용자 그림 캔버스에 2배 정수 확대해 그대로 옮긴다. */
async function spriteFromAsset(fileName) {
  const { data, info } = await sharp(
    fileURLToPath(new URL(`../public/assets/${fileName}`, import.meta.url)),
  ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const scale = 2;
  const offsetX = Math.floor((36 - info.width * scale) / 2);
  const offsetY = Math.floor((32 - info.height * scale) / 2);
  const pixels = Array(36 * 32).fill(null);

  for (let sourceY = 0; sourceY < info.height; sourceY += 1) {
    for (let sourceX = 0; sourceX < info.width; sourceX += 1) {
      const index = (sourceY * info.width + sourceX) * 4;
      if (data[index + 3] < 128) continue;
      const color = `#${[data[index], data[index + 1], data[index + 2]]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')}`;
      for (let y = 0; y < scale; y += 1) {
        for (let x = 0; x < scale; x += 1) {
          pixels[(offsetY + sourceY * scale + y) * 36 + offsetX + sourceX * scale + x] = color;
        }
      }
    }
  }
  return encodeSprite(pixels);
}

const sampleSpecs = [
  { kind: 'fish', name: '노을지느러미', message: '오늘도 천천히 헤엄쳐요', asset: 'clownfish.png' },
  { kind: 'fish', name: '파도콩', message: '파란 물결을 좋아해요', asset: 'tang.png' },
  { kind: 'decoration', name: '소원별', message: '작은 소원 하나 두고 가요', asset: 'star.png' },
  { kind: 'fish', name: '몽실해파리', message: '둥실둥실 쉬어 가세요', asset: 'jelly.png' },
  { kind: 'seaweed', name: '초록숨', message: '바다의 숨을 나눠요', asset: 'kelp.png' },
];

const samples = await Promise.all(sampleSpecs.map(async (sample) => ({
  ...sample,
  sprite: await spriteFromAsset(sample.asset),
})));

const env = parseEnv(await readFile(new URL('../.env.local', import.meta.url), 'utf8'));
const makeClient = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});

const reader = makeClient();
const { data: existing, error: existingError } = await reader
  .from('creatures')
  .select('name')
  .eq('status', 'published')
  .in('name', samples.map((sample) => sample.name));
if (existingError) throw existingError;

const existingNames = new Set((existing ?? []).map((row) => row.name));
const missing = samples.filter((sample) => !existingNames.has(sample.name));
if (missing.length === 0) {
  console.log('Sample creatures already exist; nothing to seed.');
  process.exit(0);
}

const released = [];
for (let offset = 0; offset < missing.length; offset += 3) {
  const client = makeClient();
  const { data: auth, error: authError } = await client.auth.signInAnonymously();
  if (authError) throw authError;
  const { error: identityError } = await client.rpc('claim_identity', {
    p_source: 'device',
    p_raw_key: `official-samples-${crypto.randomUUID()}`,
    p_nickname: '수족관지기',
  });
  if (identityError) throw identityError;

  for (const sample of missing.slice(offset, offset + 3)) {
    const { data, error } = await client.rpc('release_creature', {
      p_kind: sample.kind,
      p_name: sample.name,
      p_message: sample.message,
      p_sprite: sample.sprite,
      p_draft_id: null,
    });
    if (error) throw error;
    released.push(Array.isArray(data) ? data[0] : data);
  }
  await client.auth.signOut();
}

console.log(`Seeded ${released.length} sample creatures: ${released.map((row) => row.name).join(', ')}`);
