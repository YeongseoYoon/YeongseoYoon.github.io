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

function canvas() {
  return Array(36 * 32).fill(null);
}

function paint(pixels, x, y, color) {
  if (x >= 0 && x < 36 && y >= 0 && y < 32) pixels[y * 36 + x] = color;
}

function fish(body, accent) {
  const pixels = canvas();
  for (let y = 9; y <= 23; y += 1) {
    for (let x = 8; x <= 29; x += 1) {
      if (((x - 19) / 12) ** 2 + ((y - 16) / 8) ** 2 <= 1) paint(pixels, x, y, body);
    }
    const tailWidth = Math.max(0, 7 - Math.abs(y - 16));
    for (let x = 3; x < 3 + tailWidth; x += 1) paint(pixels, x, y, accent);
  }
  for (let x = 15; x <= 21; x += 1) paint(pixels, x, 12, accent);
  paint(pixels, 25, 13, '#ffffff');
  paint(pixels, 26, 13, '#23242a');
  return encodeSprite(pixels);
}

function jelly() {
  const pixels = canvas();
  for (let y = 7; y <= 18; y += 1) {
    for (let x = 8; x <= 27; x += 1) {
      if (((x - 17.5) / 10.5) ** 2 + ((y - 17) / 11) ** 2 <= 1) {
        paint(pixels, x, y, y > 15 ? '#8f6ee8' : '#c39cff');
      }
    }
  }
  for (const x of [10, 14, 19, 24]) {
    for (let y = 18; y <= 27; y += 1) {
      if ((y + x) % 3 !== 0) paint(pixels, x + Math.round(Math.sin(y) * 1.5), y, '#8f6ee8');
    }
  }
  paint(pixels, 14, 13, '#23242a');
  paint(pixels, 21, 13, '#23242a');
  return encodeSprite(pixels);
}

function star() {
  const pixels = canvas();
  const rows = [[15, 20], [12, 23], [7, 28], [11, 24], [13, 22], [14, 21], [13, 22], [11, 24], [9, 26]];
  rows.forEach(([from, to], index) => {
    for (let x = from; x <= to; x += 1) paint(pixels, x, 6 + index, '#ffd447');
  });
  for (let y = 15; y <= 25; y += 1) {
    const width = Math.max(1, 7 - Math.floor((y - 15) / 2));
    for (let x = 18 - width; x <= 18 + width; x += 1) paint(pixels, x, y, '#f7b928');
  }
  paint(pixels, 15, 13, '#23242a');
  paint(pixels, 21, 13, '#23242a');
  return encodeSprite(pixels);
}

function seaweed() {
  const pixels = canvas();
  for (const [baseX, color, phase] of [[10, '#3dbb73', 0], [18, '#69d68d', 2], [26, '#209e67', 4]]) {
    for (let y = 5; y <= 29; y += 1) {
      const x = baseX + Math.round(Math.sin((y + phase) / 3) * 2);
      for (let width = -1; width <= 1; width += 1) paint(pixels, x + width, y, color);
    }
  }
  return encodeSprite(pixels);
}

const samples = [
  { kind: 'fish', name: '노을지느러미', message: '오늘도 천천히 헤엄쳐요', sprite: fish('#f8820d', '#ffd05b') },
  { kind: 'fish', name: '파도콩', message: '파란 물결을 좋아해요', sprite: fish('#2877d4', '#55d6d2') },
  { kind: 'decoration', name: '소원별', message: '작은 소원 하나 두고 가요', sprite: star() },
  { kind: 'fish', name: '몽실해파리', message: '둥실둥실 쉬어 가세요', sprite: jelly() },
  { kind: 'seaweed', name: '초록숨', message: '바다의 숨을 나눠요', sprite: seaweed() },
];

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
