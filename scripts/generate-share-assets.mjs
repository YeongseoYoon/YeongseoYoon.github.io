import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const asset = async (name) => {
  const data = await readFile(new URL(`../public/assets/${name}`, import.meta.url));
  return `data:image/png;base64,${data.toString('base64')}`;
};

const [clownfish, tang, turtle, coral, kelp, jelly] = await Promise.all([
  asset('clownfish.png'),
  asset('tang.png'),
  asset('turtle.png'),
  asset('coral.png'),
  asset('kelp.png'),
  asset('jelly.png'),
]);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6fe4ed"/>
      <stop offset="0.5" stop-color="#2ba9bd"/>
      <stop offset="1" stop-color="#07576b"/>
    </linearGradient>
    <radialGradient id="light" cx="0.5" cy="0" r="0.8">
      <stop offset="0" stop-color="#fff" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#water)"/>
  <rect width="1200" height="630" fill="url(#light)"/>
  <g fill="none" stroke="#d9ffff" stroke-opacity="0.52" stroke-width="5">
    <circle cx="85" cy="115" r="14"/><circle cx="122" cy="65" r="7"/>
    <circle cx="1080" cy="130" r="18"/><circle cx="1040" cy="83" r="9"/>
    <circle cx="945" cy="300" r="10"/><circle cx="985" cy="252" r="6"/>
  </g>
  <path d="M0 548 C180 510 305 585 480 545 C650 505 790 580 960 540 C1065 516 1130 525 1200 548 V630 H0Z" fill="#e9c883"/>
  <path d="M0 575 C220 540 390 610 600 570 C790 535 965 604 1200 562 V630 H0Z" fill="#d8ad66" opacity="0.72"/>
  <g style="image-rendering:pixelated">
    <image href="${kelp}" x="45" y="405" width="120" height="180"/>
    <image href="${coral}" x="1050" y="414" width="105" height="150"/>
    <image href="${jelly}" x="930" y="130" width="112" height="128"/>
    <image href="${tang}" x="760" y="330" width="160" height="120"/>
    <image href="${turtle}" x="155" y="320" width="175" height="125"/>
    <image href="${clownfish}" x="495" y="305" width="210" height="154"/>
  </g>
  <g text-anchor="middle" fill="#053f50" font-family="Pretendard, Apple SD Gothic Neo, sans-serif">
    <text x="600" y="126" font-size="27" font-weight="700" letter-spacing="5">함께 채우는 픽셀 바다</text>
    <text x="600" y="205" font-size="67" font-weight="900" letter-spacing="-3">끝없는 수족관</text>
    <text x="600" y="252" font-size="26" font-weight="600">직접 그린 생물을 방류하고, 친구의 바다를 구경해요</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(fileURLToPath(new URL('../public/og-aquarium.png', import.meta.url)));
console.log('Generated public/og-aquarium.png (1200x630)');
